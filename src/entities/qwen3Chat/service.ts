import axios from 'axios';
import { Qwen3Request } from './model';
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
        let jsonStr = jsonMatch[0];

        // Очистка: заменяем физические переносы строк внутри кавычек на \n
        // Это часто ломает JSON.parse, когда AI вставляет длинные тексты
        jsonStr = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
          return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
        });

        return JSON.parse(jsonStr);
      }
      return null;
    } catch (error) {
      console.error('Ошибка парсинга JSON ответа AI:', error);
      // Если не получилось распарсить после очистки, пробуем исходный вариант
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) { }
      return null;
    }
  }

  /**
   * Форматирует результат запроса для пользователя
   */
  private static formatQueryResult(data: any, template?: string, message?: string): string {
    // Если есть сообщение от CRUD операции, возвращаем его с шаблоном
    if (message && template) {
      return template;
    }
    if (message) {
      return message;
    }

    if (template) {
      let resultText = template;

      // Функция для красивого форматирования значений (числа с пробелами)
      const formatValue = (val: any): string => {
        if (val === undefined || val === null || val === '') return '—';
        if (typeof val === 'number') {
          return val.toLocaleString('ru-RU');
        }
        return String(val);
      };

      // Функция для получения значения из объекта по пути (поддерживает вложенность, например "penaltyDetails.amount")
      const getValueByPath = (obj: any, path: string): string => {
        if (!obj || !path) return '—';

        // Поддержка вложенных путей через точку
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
          if (current === null || current === undefined) return '—';
          current = current[part];
        }

        if (current === undefined || current === null) return '—';

        // Специальная обработка для ролей
        if (path.endsWith('role') && typeof current === 'string') {
          return Qwen3ChatService.translateRole(current);
        }

        return formatValue(current);
      };

      // 1. Замена {count}
      const count = Array.isArray(data) ? data.length : (typeof data === 'number' ? data : (data ? 1 : 0));
      resultText = resultText.replace(/{count}/g, count.toString());

      // ПРОФИЛАКТИКА: Если данных нет (пустой массив), а шаблон требует {result...}, 
      // то шаблон возвращать нельзя (будут прочерки). Возвращаем сообщение о ненахождении.
      if (Array.isArray(data) && data.length === 0 && (resultText.includes('{result') || resultText.includes('{list}'))) {
        return "К сожалению, по вашему запросу ничего не найдено.";
      }

      // 2. Универсальная замена {result} и {result.path}
      // Поддерживает вложенность: {result.field.subfield}
      resultText = resultText.replace(/{result(\.[a-zA-Z0-9_\.]+)?}/g, (match, path) => {
        if (!path) {
          // Если просто {result}, форматируем весь объект или список
          if (Array.isArray(data)) {
            if (data.length === 0) return 'Список пуст';
            return data.map((item: any, index: number) => {
              if (item.fullName) {
                const role = item.role ? ` (${Qwen3ChatService.translateRole(item.role)})` : '';
                const phone = item.phone ? `, тел: ${item.phone}` : '';
                return `${index + 1}. ${item.fullName}${role}${phone}`;
              }
              return `${index + 1}. ${JSON.stringify(item)}`;
            }).join('\n');
          }
          if (data && typeof data === 'object') {
            return data.fullName
              ? `${data.fullName}${data.role ? ` (${Qwen3ChatService.translateRole(data.role)})` : ''}${data.phone ? `, тел: ${data.phone}` : ''}`
              : JSON.stringify(data);
          }
          return formatValue(data);
        } else {
          // Если {result.field.sub}, берем конкретное поле
          const fieldPath = path.substring(1); // убираем начальную точку
          const targetObj = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
          return getValueByPath(targetObj, fieldPath);
        }
      });

      // 3. Замена {list} для обратной совместимости
      if (resultText.includes('{list}')) {
        const listStr = Array.isArray(data)
          ? data.map((item: any, index: number) => item.fullName ? `${index + 1}. ${item.fullName}` : JSON.stringify(item)).join('\n')
          : String(data);
        resultText = resultText.replace(/{list}/g, listStr);
      }

      // 4. Добавление скрытых ID для контекста ИИ (невидимо для пользователя)
      let hiddenMetadata = '';
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.slice(0, 10).map((item: any) => item._id).filter(id => !!id);
        if (ids.length > 0) {
          hiddenMetadata = `\n\n[//]: # (ids: ${JSON.stringify(ids)})`;
        }
      } else if (data && typeof data === 'object' && data._id) {
        hiddenMetadata = `\n\n[//]: # (ids: ${JSON.stringify([data._id])})`;
      }

      return resultText + hiddenMetadata;
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
          const phone = item.phone ? `, тел: ${item.phone}` : '';
          return `${index + 1}. ${item.fullName}${role}${phone}`;
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
        return `${data.fullName}${data.role ? ` (${Qwen3ChatService.translateRole(data.role)})` : ''}${data.phone ? `, тел: ${data.phone}` : ''}`;
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
      'manager': 'Менеджер',
      'user': 'Пользователь',
      'teacher': 'Воспитатель',
      'assistant': 'Помощник воспитателя',
      'nurse': 'Медсестра',
      'cook': 'Повар',
      'cleaner': 'Уборщица',
      'security': 'Охранник',
      'psychologist': 'Психолог',
      'speech_therapist': 'Логопед',
      'music_teacher': 'Музыкальный руководитель',
      'physical_teacher': 'Физрук',
      'staff': 'Сотрудник',
      'rent': 'Арендатор',
      'educator': 'Педагог',
      'tenant': 'Арендатор',
      'maintenance': 'Завхоз',
      'laundry': 'Прачка',
      'substitute': 'Подменный',
      'intern': 'Стажёр',
      'director': 'Директор'
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
      const enhancedSystemPrompt = `${systemPrompt}\n\n${dataAccessPrompt}\n\n${databasePrompt}\n\n${dateContext}`;

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
      console.log('📤 [AI] Отправка запроса. Пользователь:', request.messages[request.messages.length - 1].text);
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
      const aiResponseText = response.data.choices[0].message.content;
      console.log('📥 [AI] Сырой ответ:', aiResponseText);

      // Парсим JSON из ответа AI (он может быть обернут в ```json)
      const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/) || [null, aiResponseText];
      const aiAction = JSON.parse(jsonMatch[1].trim());
      console.log('🧩 [AI] Распознанное действие:', aiAction.action);

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
            // Передаем контекст безопасности из запроса в исполнитель
            const queryWithAuth: QueryRequest = {
              ...aiAction.query,
              authContext: request.authContext
            };
            const queryResult = await executeQuery(queryWithAuth);

            if (!queryResult.success) {
              return {
                content: `Ошибка выполнения запроса: ${queryResult.error}`,
                action: 'text'
              };
            }

            console.log('📊 [DB] Результат получен. Элементов:', Array.isArray(queryResult.data) ? queryResult.data.length : (queryResult.data || queryResult.count ? 1 : 0));

            const formattedResult = this.formatQueryResult(
              queryResult.data ?? queryResult.count,
              aiAction.responseTemplate,
              queryResult.message
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
            content: aiAction.text || aiResponseText,
            action: 'text'
          };
      }

    } catch (error: any) {
      console.error('❌ Ошибка при вызове Qwen3 API:', error.response?.data || error.message);
      throw new Error(`Qwen3 API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
}