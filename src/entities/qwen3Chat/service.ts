import axios from 'axios';
import { Qwen3Request, Qwen3Response } from './model';
import fs from 'fs';
import path from 'path';
import { sendMessage } from './controller';
import FormData from 'form-data';
import { UIStateService } from '../uiState/service';

const QWEN3_API_URL = process.env.QWEN3_API_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN3_API_KEY = process.env.QWEN3_API_KEY || 'sk-5aeb0fdc7fa446c391b6d51363102e79';

export class Qwen3ChatService {
  static async sendMessage(request: Qwen3Request): Promise<Qwen3Response> {
    if (!QWEN3_API_KEY) {
      throw new Error('API ключ для Qwen3 не установлен на сервере');
    }

    try {
      // Загружаем системные промпты из файлов
      const promptPath = path.join(__dirname, 'assistant-prompt.md');
      const dataAccessPromptPath = path.join(__dirname, 'data-access-prompt.md');
      
      const systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      const dataAccessPrompt = fs.readFileSync(dataAccessPromptPath, 'utf-8');
      
      // Комбинируем промпты
      const combinedSystemPrompt = `${systemPrompt}\n\n${dataAccessPrompt}`;
      
      // Подготовка сообщений с учетом изображений
      // Получим последнее состояние UI для текущей сессии, если оно доступно
      let uiContext = '';
      if (request.sessionId) {
        try {
          const lastUIState = await UIStateService.getLastUIState(request.sessionId);
          if (lastUIState) {
            uiContext = `\n\nКонтекст текущего интерфейса:\n- Текущая страница: ${lastUIState.route}\n- URL: ${lastUIState.url}\n- Видимый текст (частично): ${lastUIState.visibleText?.substring(0, 200)}...\n- Обнаруженные ошибки: ${lastUIState.errors.length > 0 ? lastUIState.errors.join(', ') : 'нет'}\n- Количество элементов DOM: ${lastUIState.domSnapshot ? (lastUIState.domSnapshot as any).elementCount : 'неизвестно'}`;
          }
        } catch (error) {
          console.warn('Не удалось получить состояние UI:', error);
          // Продолжаем работу без контекста UI
        }
      }
      
      // Обновляем системный промпт, добавляя контекст UI
      const enhancedSystemPrompt = combinedSystemPrompt + uiContext;
      
      const messages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...request.messages.map(msg => {
          if (msg.sender === 'user') {
            if (request.image) {
              // Если есть изображение, создаем сообщение с визуальным контентом
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
              // Если нет изображения, обычное текстовое сообщение
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
        })
      ];
      
      // Определяем, нужно ли использовать multipart для передачи изображения
      if (request.image) {
        // Используем form-data для передачи изображения
        const formData = new FormData();
        
        // Добавляем тело запроса как JSON
        formData.append('model', request.model || 'qwen-vl-max');
        formData.append('messages', JSON.stringify(messages));
        
        const response = await axios.post(
          QWEN3_API_URL,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${QWEN3_API_KEY}`
            }
          }
        );

        return {
          content: response.data.choices?.[0]?.message?.content || 'Пустой ответ от модели'
        };
      } else {
        // Для текстовых сообщений используем обычный JSON
        const response = await axios.post(
          QWEN3_API_URL,
          {
            model: request.model || 'qwen-plus', // 👈 модель
            messages: messages // 👈 именно messages, не input.messages
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${QWEN3_API_KEY}`
            }
          }
        );

        return {
          content: response.data.choices?.[0]?.message?.content || 'Пустой ответ от модели'
        };
      }
    } catch (error: any) {
      console.error('❌ Ошибка при вызове Qwen3 API:', error.response?.data || error.message);
      throw new Error(`Qwen3 API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
}
