import axios from 'axios';
import { Qwen3Request } from './model';
import { UIStateService } from '../uiState/service';
import { executeQuery, QueryRequest } from './queryExecutor';
import { ASSISTANT_PROMPT, DATA_ACCESS_PROMPT, DATABASE_PROMPT } from './prompts';

const QWEN3_API_URL = process.env.QWEN3_API_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN3_API_KEY = process.env.QWEN3_API_KEY || 'sk-5aeb0fdc7fa446c391b6d51363102e79';

// Локальный интерфейс для ответа (чтобы избежать проблем с кэшем ts-node-dev)
interface ServiceResponse {
  content: string;
  action?: 'query' | 'navigate' | 'text';
  navigateTo?: string;
}


interface AIAction {
  action: 'query' | 'navigate' | 'text';
  query?: QueryRequest;
  navigate?: {
    route: string;
    description: string;
  };
  text?: string;
  responseTemplate?: string;
}

export class Qwen3ChatService {
  /**
   * Парсит JSON-ответ от AI модели
   */
  private static parseAIResponse(content: string): AIAction | null {
    try {
      // Пытаемся найти JSON в ответе
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Ошибка парсинга JSON ответа AI:', error);
      return null;
    }
  }

  /**
   * Форматирует результат запроса для пользователя
   */
  private static formatQueryResult(data: any, template?: string): string {
    if (template) {
      let result = template;

      // Замена {count}
      if (typeof data === 'number') {
        result = result.replace('{count}', data.toString());
      } else if (Array.isArray(data)) {
        result = result.replace('{count}', data.length.toString());

        // Замена {list}
        if (data.length > 0) {
          const list = data.map((item: any, index: number) => {
            if (item.fullName) {
              const role = item.role ? ` (${Qwen3ChatService.translateRole(item.role)})` : '';
              return `${index + 1}. ${item.fullName}${role}`;
            }
            return `${index + 1}. ${JSON.stringify(item)}`;
          }).join('\n');
          result = result.replace('{list}', list);
        } else {
          result = result.replace('{list}', 'Список пуст');
        }
      }

      return result;
    }

    // Дефолтное форматирование
    if (typeof data === 'number') {
      return `Результат: ${data}`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 'Данные не найдены.';
      }

      const formatted = data.slice(0, 10).map((item: any, index: number) => {
        if (item.fullName) {
          const role = item.role ? ` (${Qwen3ChatService.translateRole(item.role)})` : '';
          return `${index + 1}. ${item.fullName}${role}`;
        }
        if (item.name) {
          return `${index + 1}. ${item.name}`;
        }
        return `${index + 1}. ${JSON.stringify(item)}`;
      }).join('\n');

      const suffix = data.length > 10 ? `\n... и ещё ${data.length - 10}` : '';
      return formatted + suffix;
    }

    if (data && typeof data === 'object') {
      if (data.fullName) {
        return `${data.fullName}${data.role ? ` (${Qwen3ChatService.translateRole(data.role)})` : ''}`;
      }
      return JSON.stringify(data, null, 2);
    }

    return String(data);
  }

  /**
   * Переводит роль на русский
   */
  private static translateRole(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Администратор',
      'teacher': 'Воспитатель',
      'assistant': 'Помощник воспитателя',
      'nurse': 'Медсестра',
      'cook': 'Повар',
      'cleaner': 'Уборщица',
      'security': 'Охранник',
      'psychologist': 'Психолог',
      'music_teacher': 'Музыкальный руководитель',
      'physical_teacher': 'Физрук',
      'staff': 'Сотрудник',
      'rent': 'Арендатор'
    };
    return roles[role] || role;
  }

  /**
   * Получает текущую дату/время для контекста
   */
  private static getCurrentDateContext(): string {
    const now = new Date();
    const kazakhstanOffset = 5 * 60; // UTC+5 в минутах
    const localOffset = now.getTimezoneOffset();
    const kazakhstanTime = new Date(now.getTime() + (kazakhstanOffset + localOffset) * 60000);

    const dateStr = kazakhstanTime.toISOString().split('T')[0];
    const timeStr = kazakhstanTime.toTimeString().split(' ')[0].substring(0, 5);

    return `Текущая дата: ${dateStr}, время: ${timeStr} (Казахстан, UTC+5)`;
  }

  static async sendMessage(request: Qwen3Request): Promise<ServiceResponse> {
    if (!QWEN3_API_KEY) {
      throw new Error('API ключ для Qwen3 не установлен на сервере');
    }

    try {
      // Используем константы промптов (для работы на Vercel Serverless)
      const systemPrompt = ASSISTANT_PROMPT;
      const dataAccessPrompt = DATA_ACCESS_PROMPT;
      const databasePrompt = DATABASE_PROMPT;

      const dateContext = this.getCurrentDateContext();
      const combinedSystemPrompt = `${systemPrompt}\n\n${dataAccessPrompt}\n\n${databasePrompt}\n\n${dateContext}`;

      let uiContext = '';
      if (request.sessionId) {
        try {
          const lastUIState = await UIStateService.getLastUIState(request.sessionId);
          if (lastUIState) {
            uiContext = `\n\nКонтекст текущего интерфейса:\n- Текущая страница: ${lastUIState.route}\n- URL: ${lastUIState.url}`;
          }
        } catch (error) {
          console.warn('Не удалось получить состояние UI:', error);
        }
      }

      const enhancedSystemPrompt = combinedSystemPrompt + uiContext;

      const messages = await Promise.all(request.messages.map(async msg => {
        if (msg.sender === 'user') {
          if (request.image) {
            return {
              role: 'user',
              content: [
                { type: 'text', text: msg.text },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${request.image.mimetype};base64,${request.image.buffer.toString('base64')}`
                  }
                }
              ]
            };
          } else {
            return {
              role: 'user',
              content: msg.text
            };
          }
        } else {
          return {
            role: 'assistant',
            content: msg.text
          };
        }
      }));


      messages.unshift({ role: 'system', content: enhancedSystemPrompt });

      // Первый запрос к AI для получения действия
      console.log('📤 Отправка запроса к Qwen API...');
      const response = await axios.post(
        QWEN3_API_URL,
        {
          model: request.model || (request.image ? 'qwen-vl-max' : 'qwen-plus'),
          messages: messages
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QWEN3_API_KEY}`
          },
          timeout: 60000 // 60 секунд таймаут
        }
      );
      console.log('📥 Ответ получен от Qwen API');

      const aiContent = response.data.choices?.[0]?.message?.content || '';
      console.log('AI Response:', aiContent);

      // Парсим ответ AI
      const aiAction = this.parseAIResponse(aiContent);

      if (!aiAction) {
        // Если не удалось распарсить, возвращаем как есть
        return {
          content: aiContent,
          action: 'text'
        };
      }

      // Обрабатываем действие
      switch (aiAction.action) {
        case 'navigate':
          return {
            content: aiAction.navigate?.description || 'Перехожу на страницу...',
            action: 'navigate',
            navigateTo: aiAction.navigate?.route
          };

        case 'query':
          if (aiAction.query) {
            console.log('Executing query:', JSON.stringify(aiAction.query));
            const queryResult = await executeQuery(aiAction.query);

            if (!queryResult.success) {
              return {
                content: `Ошибка выполнения запроса: ${queryResult.error}`,
                action: 'text'
              };
            }

            const formattedResult = this.formatQueryResult(
              queryResult.data ?? queryResult.count,
              aiAction.responseTemplate
            );

            return {
              content: formattedResult,
              action: 'text'
            };
          }
          return {
            content: 'Ошибка: запрос не указан',
            action: 'text'
          };

        case 'text':
        default:
          return {
            content: aiAction.text || aiContent,
            action: 'text'
          };
      }

    } catch (error: any) {
      console.error('❌ Ошибка при вызове Qwen3 API:', error.response?.data || error.message);
      throw new Error(`Qwen3 API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
}