import axios from 'axios';
import { Qwen3Request, Qwen3Response } from './model';
import fs from 'fs';
import path from 'path';
import { sendMessage } from './controller';
import FormData from 'form-data';
import { UIStateService } from '../uiState/service';

const QWEN3_API_URL = process.env.QWEN3_API_URL || 'https://api.qwen3.com/v1/chat/completions';
const QWEN3_API_KEY = process.env.QWEN3_API_KEY || 'sk-5aeb0fdc7fa446c391b6d51363102e79';

export class Qwen3ChatService {
  static async sendMessage(request: Qwen3Request): Promise<Qwen3Response> {
    if (!QWEN3_API_KEY) {
      throw new Error('API ключ для Qwen3 не установлен на сервере');
    }

    try {
      const promptPath = path.join(__dirname, 'assistant-prompt.md');
      const dataAccessPromptPath = path.join(__dirname, 'data-access-prompt.md');

      const systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      const dataAccessPrompt = fs.readFileSync(dataAccessPromptPath, 'utf-8');

      const combinedSystemPrompt = `${systemPrompt}\n\n${dataAccessPrompt}`;

      let uiContext = '';
      if (request.sessionId) {
        try {
          const lastUIState = await UIStateService.getLastUIState(request.sessionId);
          if (lastUIState) {
            uiContext = `\n\nКонтекст текущего интерфейса:\n- Текущая страница: ${lastUIState.route}\n- URL: ${lastUIState.url}\n- Видимый текст (частично): ${lastUIState.visibleText?.substring(0, 200)}...\n- Обнаруженные ошибки: ${lastUIState.uiErrors.length > 0 ? lastUIState.uiErrors.join(', ') : 'нет'}\n- Количество элементов DOM: ${lastUIState.domSnapshot ? (lastUIState.domSnapshot as any).elementCount : 'неизвестно'}`;
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
          }
        }
      );

      return {
        content: response.data.choices?.[0]?.message?.content || 'Пустой ответ от модели'
      };
    } catch (error: any) {
      console.error('❌ Ошибка при вызове Qwen3 API:', error.response?.data || error.message);
      throw new Error(`Qwen3 API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
}