import axios from 'axios';
import { Qwen3Request, PendingAction } from './model';
import { executeQuery, QueryRequest } from './queryExecutor';
import { ASSISTANT_PROMPT, DATA_ACCESS_PROMPT, DATABASE_PROMPT } from './prompts';
import { productsService } from '../food/products/service';
import { dishesService } from '../food/dishes/service';
import crypto from 'crypto';

const QWEN3_API_URL = process.env.QWEN3_API_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN3_API_KEY = process.env.QWEN3_API_KEY || 'sk-5aeb0fdc7fa446c391b6d51363102e79';

// Операции записи, которые требуют подтверждения пользователя
const WRITE_OPERATIONS = ['insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];

// Локальный интерфейс для ответа
interface ServiceResponse {
  content: string;
  action?: 'query' | 'navigate' | 'text' | 'create_dish_from_name' | 'confirm_action';
  navigateTo?: string;
  pendingAction?: PendingAction;
}

interface AIAction {
  action: 'query' | 'navigate' | 'text' | 'create_dish_from_name' | 'check_dish_exists';
  query?: QueryRequest;
  navigate?: {
    route: string;
    description: string;
  };
  text?: string;
  responseTemplate?: string;
  dishName?: string;
  ingredients?: { productName: string, quantity: number, unit: string }[];
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
        jsonStr = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
          return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
        });

        return JSON.parse(jsonStr);
      }
      return null;
    } catch (error) {
      console.error('Ошибка парсинга JSON ответа AI:', error, 'Содержимое:', content);
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) { }
      return null;
    }
  }

  /**
   * Санитизирует текст ответа: убирает сырой JSON, ${...}, undefined и прочий мусор
   */
  private static sanitizeResponseText(text: string): string {
    if (!text || typeof text !== 'string') return 'Не удалось сформировать ответ.';

    let result = text;

    // 1. Убираем ${...} паттерны (нераскрытые шаблонные переменные)
    result = result.replace(/\$\{[^}]*\}/g, '');

    // 2. Убираем слово "undefined" как самостоятельное значение
    result = result.replace(/:\s*undefined/gi, ': —');
    result = result.replace(/\bundefined\b/gi, '—');

    // 3. Убираем слово "null" как самостоятельное значение
    result = result.replace(/:\s*null/gi, ': —');
    result = result.replace(/\bnull\b/gi, '—');

    // 4. Убираем сырой JSON из ответа (блоки {...} с ключами MongoDB вроде _id, $oid, ObjectId)
    result = result.replace(/\{[^{}]*"\$oid"[^{}]*\}/g, '');
    result = result.replace(/\{[^{}]*"_id"[^{}]*"createdAt"[^{}]*\}/g, '');

    // 5. Убираем JSON-массивы в ответе (если это не форматированный список)
    result = result.replace(/\[\s*\{[^[\]]*"_id"[^[\]]*\}\s*\]/g, '');

    // 6. Убираем скрытые метаданные markdown-комментарии (ids)
    // НЕ убираем — они полезны для контекста

    // 7. Убираем множественные пустые строки
    result = result.replace(/\n{3,}/g, '\n\n');

    // 8. Убираем лишние пробелы
    result = result.trim();

    // 9. Если после санитизации текст пуст — дефолтное сообщение
    if (!result || result === '—') {
      return 'Не удалось сформировать ответ. Попробуйте переформулировать вопрос.';
    }

    return result;
  }

  /**
   * Форматирует результат запроса для пользователя
   */
  private static formatQueryResult(data: any, template?: string, message?: string): string {
    // Если есть сообщение от CRUD операции, возвращаем его с шаблоном
    if (message && template) {
      return this.sanitizeResponseText(template);
    }
    if (message) {
      return this.sanitizeResponseText(message);
    }

    if (template) {
      let resultText = template;

      // Функция для красивого форматирования значений
      const formatValue = (val: any): string => {
        if (val === undefined || val === null || val === '') return '—';
        if (typeof val === 'number') {
          return val.toLocaleString('ru-RU');
        }
        if (typeof val === 'object') {
          // Не возвращаем сырой JSON пользователю
          if (val._id) return val.fullName || val.name || val.title || String(val._id);
          return '—';
        }
        return String(val);
      };

      // Функция для получения значения из объекта по пути
      const getValueByPath = (obj: any, path: string): string => {
        if (!obj || !path) return '—';

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
      let count: number;
      if (Array.isArray(data)) {
        count = data.length;
      } else if (typeof data === 'number') {
        count = data;
      } else if (data && typeof data === 'object') {
        count = data.modifiedCount ?? data.deletedCount ?? data.matchedCount ?? (data._id ? 1 : 0);
      } else {
        count = data ? 1 : 0;
      }
      resultText = resultText.replace(/{count}/g, count.toString());

      // Если данных нет, а шаблон ожидает {result...}
      if (Array.isArray(data) && data.length === 0 && (resultText.includes('{result') || resultText.includes('{list}'))) {
        return 'К сожалению, по вашему запросу ничего не найдено.';
      }

      // 2. Замена {result} и {result.path}
      resultText = resultText.replace(/{result(\.[a-zA-Z0-9_\.]+)?}/g, (match, path) => {
        if (!path) {
          if (Array.isArray(data)) {
            if (data.length === 0) return 'Список пуст';
            return data.map((item: any, index: number) => {
              return this.formatSingleItem(item, index);
            }).join('\n');
          }
          if (data && typeof data === 'object') {
            return this.formatSingleItem(data, -1);
          }
          return formatValue(data);
        } else {
          const fieldPath = path.substring(1);
          const targetObj = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
          return getValueByPath(targetObj, fieldPath);
        }
      });

      // 3. Замена {list}
      if (resultText.includes('{list}')) {
        const listStr = Array.isArray(data)
          ? data.map((item: any, index: number) => this.formatSingleItem(item, index)).join('\n')
          : String(data);
        resultText = resultText.replace(/{list}/g, listStr);
      }

      // 4. Добавление скрытых ID для контекста ИИ
      let hiddenMetadata = '';
      if (Array.isArray(data) && data.length > 0) {
        const ids = data.slice(0, 10).map((item: any) => item._id).filter(id => !!id);
        if (ids.length > 0) {
          hiddenMetadata = `\n\n[//]: # (ids: ${JSON.stringify(ids)})`;
        }
      } else if (data && typeof data === 'object' && data._id) {
        hiddenMetadata = `\n\n[//]: # (ids: ${JSON.stringify([data._id])})`;
      }

      return this.sanitizeResponseText(resultText) + hiddenMetadata;
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
        return this.formatSingleItem(item, index);
      }).join('\n');

      const suffix = data.length > 10 ? `\n... и ещё ${data.length - 10}` : '';
      return formatted + suffix;
    }

    if (data && typeof data === 'object') {
      return this.formatSingleItem(data, -1);
    }

    return String(data);
  }

  /**
   * Форматирует один элемент данных для вывода пользователю (без сырого JSON)
   */
  private static formatSingleItem(item: any, index: number): string {
    if (!item || typeof item !== 'object') return formatValueSafe(item);

    const prefix = index >= 0 ? `${index + 1}. ` : '';

    // Сотрудник / пользователь
    if (item.fullName) {
      const role = item.role ? ` (${this.translateRole(item.role)})` : '';
      const phone = item.phone ? `, тел: ${item.phone}` : '';
      const salary = item.baseSalary ? `, оклад: ${Number(item.baseSalary).toLocaleString('ru-RU')} тг` : '';
      return `${prefix}${item.fullName}${role}${phone}${salary}`;
    }

    // Ребёнок
    if (item.parentName) {
      const group = item.groupId ? `, группа: ${item.groupId}` : '';
      return `${prefix}${item.name || item.fullName || '—'}${group}, родитель: ${item.parentName}`;
    }

    // Блюдо
    if (item.ingredients && item.category) {
      return `${prefix}${item.name || '—'} (${this.translateCategory(item.category)}), ${item.ingredients.length} ингредиентов`;
    }

    // Задача
    if (item.title && item.status) {
      const priority = item.priority ? ` [${item.priority}]` : '';
      return `${prefix}${item.title} — ${this.translateStatus(item.status)}${priority}`;
    }

    // Группа
    if (item.name && item.maxStudents !== undefined) {
      return `${prefix}${item.name}, макс. ${item.maxStudents} детей`;
    }

    // Зарплата
    if (item.period && item.total !== undefined) {
      const staffName = item.fullName || item.staffName || '';
      return `${prefix}${staffName ? staffName + ', ' : ''}период: ${item.period}, итого: ${Number(item.total).toLocaleString('ru-RU')} тг`;
    }

    // Платёж
    if (item.amount !== undefined && item.status) {
      return `${prefix}сумма: ${Number(item.amount).toLocaleString('ru-RU')} тг, статус: ${this.translateStatus(item.status)}`;
    }

    // Объект с именем
    if (item.name) {
      return `${prefix}${item.name}`;
    }

    // Объект с заголовком
    if (item.title) {
      return `${prefix}${item.title}`;
    }

    // Fallback: выводим ключевые поля без _id и системных полей
    const keys = Object.keys(item).filter(k => !['_id', '__v', 'createdAt', 'updatedAt', 'passwordHash'].includes(k));
    const summary = keys.slice(0, 5).map(k => {
      const val = item[k];
      if (val === undefined || val === null) return null;
      if (typeof val === 'object') return null;
      return `${k}: ${val}`;
    }).filter(Boolean).join(', ');

    return `${prefix}${summary || 'Запись'}`;
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
   * Переводит категорию блюда на русский
   */
  private static translateCategory(category: string): string {
    const categories: Record<string, string> = {
      'breakfast': 'Завтрак',
      'lunch': 'Обед',
      'snack': 'Полдник',
      'dinner': 'Ужин'
    };
    return categories[category] || category;
  }

  /**
   * Переводит статус на русский
   */
  private static translateStatus(status: string): string {
    const statuses: Record<string, string> = {
      'todo': 'К выполнению',
      'in-progress': 'В работе',
      'done': 'Выполнено',
      'paid': 'Оплачено',
      'unpaid': 'Не оплачено',
      'draft': 'Черновик',
      'approved': 'Утверждено',
      'present': 'Присутствует',
      'absent': 'Отсутствует',
      'sick': 'Болеет',
      'vacation': 'Отпуск',
      'late': 'Опоздание',
      'active': 'Активен',
      'inactive': 'Неактивен',
      'pending': 'Ожидает',
      'cancelled': 'Отменено',
      'completed': 'Завершено'
    };
    return statuses[status] || status;
  }

  /**
   * Генерирует человеко-понятное описание CRUD операции для подтверждения
   */
  private static describeCrudAction(query: QueryRequest, responseTemplate?: string): string {
    const collectionNames: Record<string, string> = {
      'users': 'Сотрудники',
      'children': 'Дети',
      'groups': 'Группы',
      'payrolls': 'Зарплаты',
      'staff_shifts': 'Смены сотрудников',
      'staff_attendance_tracking': 'Посещаемость сотрудников',
      'childattendances': 'Посещаемость детей',
      'child_payments': 'Платежи за детей',
      'rent_payments': 'Платежи за аренду',
      'tasks': 'Задачи',
      'documents': 'Документы',
      'settings': 'Настройки',
      'products': 'Продукты',
      'dishes': 'Блюда',
      'daily_menus': 'Дневное меню',
      'weekly_menu_templates': 'Шаблоны меню',
      'product_purchases': 'Закупки',
      'health_passports': 'Паспорта здоровья',
      'mantoux_journal': 'Журнал Манту',
      'somatic_journal': 'Соматический журнал',
      'helminth_journal': 'Журнал гельминтов',
      'infectious_diseases_journal': 'Журнал инфекций',
      'contact_infection_journal': 'Контактные инфекции',
      'tub_positive_journal': 'Туб-положительные',
      'risk_group_children': 'Дети группы риска',
      'food_stock_log': 'Склад продуктов',
      'organoleptic_journal': 'Органолептический журнал',
      'perishable_brak': 'Брак скоропортящихся',
      'detergent_log': 'Журнал моющих средств',
      'food_staff_health': 'Здоровье персонала пищеблока',
      'product_certificates': 'Сертификаты продуктов',
      'external_specialists': 'Внешние специалисты',
      'main_events': 'События',
      'menu_items': 'Элементы меню',
      'food_norms_control': 'Контроль норм питания'
    };

    const collName = collectionNames[query.collection] || query.collection;
    const operation = query.operation;

    let description = '';

    switch (operation) {
      case 'insertOne': {
        description = `Создание записи в "${collName}"`;
        if (query.document) {
          const docKeys = Object.keys(query.document).filter(k => !['createdAt', 'updatedAt'].includes(k));
          const preview = docKeys.slice(0, 4).map(k => {
            const val = query.document![k];
            if (typeof val === 'object') return `${k}: [...]`;
            return `${k}: ${val}`;
          }).join(', ');
          description += `\nДанные: ${preview}`;
        }
        break;
      }
      case 'updateOne':
      case 'updateMany': {
        const many = operation === 'updateMany' ? ' (массовое)' : '';
        description = `Обновление записи в "${collName}"${many}`;
        if (query.filter) {
          const filterStr = this.describeFilter(query.filter);
          description += `\nУсловие: ${filterStr}`;
        }
        if (query.update && query.update.$set) {
          const setKeys = Object.keys(query.update.$set).filter(k => k !== 'updatedAt');
          const preview = setKeys.slice(0, 4).map(k => {
            const val = query.update!.$set[k];
            if (typeof val === 'object') return `${k}: [...]`;
            return `${k}: ${val}`;
          }).join(', ');
          description += `\nИзменения: ${preview}`;
        }
        break;
      }
      case 'deleteOne':
      case 'deleteMany': {
        const many = operation === 'deleteMany' ? ' (массовое)' : '';
        description = `Удаление записи из "${collName}"${many}`;
        if (query.filter) {
          const filterStr = this.describeFilter(query.filter);
          description += `\nУсловие: ${filterStr}`;
        }
        break;
      }
      default:
        description = `Операция ${operation} в "${collName}"`;
    }

    return description;
  }

  /**
   * Описывает фильтр в человеко-понятном виде
   */
  private static describeFilter(filter: Record<string, any>): string {
    const parts: string[] = [];
    for (const key of Object.keys(filter)) {
      const val = filter[key];
      if (val && typeof val === 'object') {
        if (val.$regex) {
          parts.push(`${key} содержит "${val.$regex}"`);
        } else if (val.$oid) {
          parts.push(`${key} = ${val.$oid}`);
        } else if (val.$ne !== undefined) {
          parts.push(`${key} не равно "${val.$ne}"`);
        } else if (val.$gte || val.$lte) {
          if (val.$gte) parts.push(`${key} от ${val.$gte}`);
          if (val.$lte) parts.push(`${key} до ${val.$lte}`);
        } else {
          parts.push(`${key}: ${JSON.stringify(val)}`);
        }
      } else {
        parts.push(`${key} = ${val}`);
      }
    }
    return parts.join(', ') || 'без условий';
  }

  /**
   * Получает текущую дату/время для контекста
   */
  private static getCurrentDateContext(): string {
    const now = new Date();
    const KZ_OFFSET_MS = 5 * 60 * 60 * 1000;
    const kzPseudoTime = new Date(now.getTime() + KZ_OFFSET_MS);
    const dateStr = kzPseudoTime.toISOString().split('T')[0];
    const timeStr = kzPseudoTime.toISOString().split('T')[1].substring(0, 5);
    return `Текущая дата: ${dateStr}, время: ${timeStr} (Казахстан, UTC+5)`;
  }

  /**
   * Основной метод отправки сообщения в ИИ
   */
  static async sendMessage(request: Qwen3Request): Promise<ServiceResponse> {
    if (!QWEN3_API_KEY) {
      throw new Error('API ключ для Qwen3 не установлен на сервере');
    }

    try {
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

      console.log('[AI] Отправка запроса. Пользователь:', request.messages[request.messages.length - 1].text);

      if (!messages || messages.length === 0) {
        throw new Error('Нет сообщений для отправки в AI');
      }

      const response = await axios.post(
        QWEN3_API_URL,
        {
          model: request.model || (request.image ? 'qwen-vl-max' : 'qwen-plus'),
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QWEN3_API_KEY}`,
            'User-Agent': 'Detsad-Bot/1.0'
          },
          timeout: 60000
        }
      );

      console.log('[AI] Ответ получен от API');

      const aiResponseText = response.data.choices[0].message.content;
      console.log('[AI] Сырой текст:', aiResponseText);

      // Парсим JSON из ответа AI
      let aiAction = this.parseAIResponse(aiResponseText);

      if (!aiAction) {
        // Если не удалось распарсить JSON, считаем текстовым сообщением
        aiAction = { action: 'text', text: aiResponseText };
        console.log('[AI] Действие: text (дефолтное)');
      } else {
        console.log('[AI] Действие:', aiAction.action);
      }

      // Обрабатываем действие
      switch (aiAction.action) {
        case 'navigate':
          return {
            content: this.sanitizeResponseText(aiAction.navigate?.description || 'Перехожу на страницу...'),
            action: 'navigate',
            navigateTo: aiAction.navigate?.route
          };

        case 'query':
          if (aiAction.query) {
            // --- СИСТЕМА ПОДТВЕРЖДЕНИЯ ---
            // Если это write-операция, запрашиваем подтверждение
            if (WRITE_OPERATIONS.includes(aiAction.query.operation)) {
              const pendingId = crypto.randomUUID();
              const description = this.describeCrudAction(aiAction.query, aiAction.responseTemplate);

              const pendingAction: PendingAction = {
                id: pendingId,
                type: 'crud_query',
                description: description,
                query: aiAction.query,
                responseTemplate: aiAction.responseTemplate
              };

              const operationLabels: Record<string, string> = {
                'insertOne': 'создание',
                'updateOne': 'обновление',
                'updateMany': 'массовое обновление',
                'deleteOne': 'удаление',
                'deleteMany': 'массовое удаление'
              };

              const opLabel = operationLabels[aiAction.query.operation] || aiAction.query.operation;

              return {
                content: `Для выполнения операции "${opLabel}" требуется ваше подтверждение:\n\n${description}\n\nПодтвердите или отмените действие.`,
                action: 'confirm_action',
                pendingAction
              };
            }

            // Обычные read-операции — выполняем сразу
            console.log('Executing read query:', JSON.stringify(aiAction.query));
            const queryWithAuth: QueryRequest = {
              ...aiAction.query,
              authContext: request.authContext
            };

            try {
              const queryResult = await executeQuery(queryWithAuth);

              if (!queryResult.success) {
                return {
                  content: `Не удалось выполнить запрос: ${queryResult.error || 'Неизвестная ошибка'}`,
                  action: 'text'
                };
              }

              console.log('[DB] Результат получен. Элементов:', Array.isArray(queryResult.data) ? queryResult.data.length : (queryResult.data || queryResult.count ? 1 : 0));

              const formattedResult = this.formatQueryResult(
                queryResult.data ?? queryResult.count,
                aiAction.responseTemplate,
                queryResult.message
              );

              return {
                content: this.sanitizeResponseText(formattedResult),
                action: 'text'
              };
            } catch (error: any) {
              console.error('Ошибка при выполнении запроса:', error);
              return {
                content: `Не удалось выполнить запрос к базе данных. Попробуйте переформулировать вопрос.`,
                action: 'text'
              };
            }
          }
          return {
            content: 'Не удалось сформировать запрос. Попробуйте переформулировать.',
            action: 'text'
          };

        case 'check_dish_exists':
          if (!aiAction.dishName) {
            return {
              content: 'Не указано название блюда для проверки.',
              action: 'text'
            };
          }
          try {
            const existingDish = await dishesService.findByName(aiAction.dishName);
            if (existingDish) {
              return {
                content: `Блюдо "${existingDish.name}" уже существует в базе данных. Категория: ${this.translateCategory(existingDish.category)}.`,
                action: 'text'
              };
            } else {
              return {
                content: `Блюдо "${aiAction.dishName}" не найдено в базе данных. Можно создать новое блюдо.`,
                action: 'text'
              };
            }
          } catch (error: any) {
            console.error('Ошибка при проверке блюда:', error);
            return {
              content: 'Не удалось проверить наличие блюда. Попробуйте позже.',
              action: 'text'
            };
          }

        case 'create_dish_from_name':
          if (!aiAction.dishName || !aiAction.ingredients) {
            return {
              content: 'Не удалось определить название блюда или ингредиенты.',
              action: 'text'
            };
          }

          // Запрашиваем подтверждение на создание блюда
          {
            const pendingId = crypto.randomUUID();
            const ingredientsList = aiAction.ingredients.map(
              (ing, i) => `  ${i + 1}. ${ing.productName} — ${ing.quantity} ${ing.unit}`
            ).join('\n');

            const description = `Создание блюда "${aiAction.dishName}"\nКатегория: ${this.translateCategory(aiAction.category || 'breakfast')}\nИнгредиенты:\n${ingredientsList}`;

            const pendingAction: PendingAction = {
              id: pendingId,
              type: 'create_dish',
              description,
              dishData: {
                dishName: aiAction.dishName,
                category: aiAction.category || 'breakfast',
                ingredients: aiAction.ingredients
              }
            };

            return {
              content: `Для создания блюда требуется ваше подтверждение:\n\n${description}\n\nПодтвердите или отмените действие.`,
              action: 'confirm_action',
              pendingAction
            };
          }

        case 'text':
        default:
          return {
            content: this.sanitizeResponseText(aiAction.text || aiResponseText),
            action: 'text'
          };
      }

    } catch (error: any) {
      console.error('Ошибка при вызове Qwen3 API:', error);
      if (error.response) {
        throw new Error(`Ошибка API: ${error.response.status} - ${error.response.statusText || 'Неизвестная ошибка'}`);
      } else if (error.request) {
        throw new Error('Не удалось подключиться к AI. Проверьте соединение с интернетом.');
      } else {
        throw new Error(`Ошибка: ${error.message}`);
      }
    }
  }

  /**
   * Выполняет подтверждённое пользователем действие
   */
  static async executeConfirmedAction(pendingAction: PendingAction, authContext?: { userId: string; role: string; groupId?: string }): Promise<ServiceResponse> {
    console.log('[AI] Выполнение подтверждённого действия:', pendingAction.id, pendingAction.type);

    switch (pendingAction.type) {
      case 'crud_query': {
        if (!pendingAction.query) {
          return { content: 'Ошибка: данные операции не найдены.', action: 'text' };
        }

        const queryWithAuth: QueryRequest = {
          ...pendingAction.query,
          authContext
        };

        try {
          const queryResult = await executeQuery(queryWithAuth);

          if (!queryResult.success) {
            return {
              content: `Не удалось выполнить операцию: ${queryResult.error || 'Неизвестная ошибка'}`,
              action: 'text'
            };
          }

          const formattedResult = this.formatQueryResult(
            queryResult.data ?? queryResult.count,
            pendingAction.responseTemplate,
            queryResult.message
          );

          return {
            content: this.sanitizeResponseText(formattedResult),
            action: 'text'
          };
        } catch (error: any) {
          console.error('Ошибка при выполнении подтверждённого запроса:', error);
          return {
            content: 'Не удалось выполнить операцию. Попробуйте позже.',
            action: 'text'
          };
        }
      }

      case 'create_dish': {
        if (!pendingAction.dishData) {
          return { content: 'Ошибка: данные блюда не найдены.', action: 'text' };
        }

        const { dishName, category, ingredients: rawIngredients } = pendingAction.dishData;

        try {
          // Проверяем существование
          const existingDish = await dishesService.findByName(dishName);
          if (existingDish) {
            return {
              content: `Блюдо "${existingDish.name}" уже существует. Категория: ${this.translateCategory(existingDish.category)}.`,
              action: 'text'
            };
          }

          const ingredients = [];
          for (const ing of rawIngredients) {
            const product = await productsService.findByNameOrCreate({ name: ing.productName, unit: ing.unit });
            ingredients.push({
              productId: product._id,
              quantity: ing.quantity,
              unit: ing.unit
            });
          }

          const newDish = await dishesService.create({
            name: dishName,
            ingredients,
            category: category as any || 'breakfast',
            createdBy: authContext?.userId as any
          });

          return {
            content: `Блюдо "${newDish.name}" успешно создано с ${newDish.ingredients.length} ингредиентами. Категория: ${this.translateCategory(newDish.category)}.`,
            action: 'text'
          };
        } catch (error: any) {
          console.error('Ошибка при создании блюда:', error);
          return {
            content: `Не удалось создать блюдо: ${error.message}`,
            action: 'text'
          };
        }
      }

      default:
        return { content: 'Неизвестный тип действия.', action: 'text' };
    }
  }
}

/**
 * Безопасное форматирование значения (вспомогательная функция)
 */
function formatValueSafe(val: any): string {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'number') return val.toLocaleString('ru-RU');
  if (typeof val === 'object') return '—';
  return String(val);
}
