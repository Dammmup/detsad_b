import axios from 'axios';
import { Qwen3Request, PendingAction } from './model';
import { executeQuery, QueryRequest } from './queryExecutor';
import { ASSISTANT_PROMPT, DATA_ACCESS_PROMPT, DATABASE_PROMPT } from './prompts';
import { productsService } from '../food/products/service';
import { dishesService } from '../food/dishes/service';
import crypto from 'crypto';
import Child from '../children/model';
import User from '../users/model';
import ChildPayment from '../childPayment/model';
import Payroll from '../payroll/model';
import StaffAttendanceTracking from '../staffAttendanceTracking/model';
import Task from '../taskList/model';
import Rent from '../rent/model';
import Product from '../food/products/model';
import DailyMenu from '../food/dailyMenu/model';
import Shift from '../staffShifts/model';
import ExternalSpecialist from '../externalSpecialists/model';
import { escapeRegex } from '../../utils/sanitize';

const QWEN3_API_URL = process.env.QWEN3_API_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN3_API_KEY = process.env.QWEN3_API_KEY;
if (!QWEN3_API_KEY) {
  console.warn('⚠️ QWEN3_API_KEY не установлен в переменных окружения');
}

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
  action: 'query' | 'navigate' | 'text' | 'create_dish_from_name' | 'check_dish_exists'
    | 'update_child_payment_status' | 'analyze_payroll'
    | 'generate_attendance_report' | 'generate_child_payment_report'
    | 'get_overdue_tasks' | 'update_task_status'
    | 'generate_rent_report' | 'update_rent_payment_status'
    | 'check_product_alerts' | 'get_today_menu'
    | 'get_child_info' | 'get_staff_summary';
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
  // Новые поля для специализированных действий
  childName?: string;
  staffName?: string;
  period?: string;
  monthPeriod?: string;
  newStatus?: 'paid' | 'active';
  paidAmount?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  // Поля для новых действий
  taskId?: string;
  taskStatus?: 'in_progress' | 'completed' | 'cancelled';
  priority?: string;
  tenantName?: string;
  rentPeriod?: string;
  rentStatus?: 'paid' | 'active';
  rentAmount?: number;
  groupName?: string;
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
    result = result.replace(/ObjectId\("[^"]*"\)/g, '');
    result = result.replace(/new Date\("[^"]*"\)/g, '');

    // 5. Убираем JSON-массивы в ответе (если это не форматированный список)
    result = result.replace(/\[\s*\{[^[\]]*"_id"[^[\]]*\}\s*\]/g, '');

    // 5b. Убираем NaN
    result = result.replace(/\bNaN\b/g, '0');

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
      'completed': 'Завершено',
      'overdue': 'Просрочено',
      'in_progress': 'В процессе',
      'scheduled': 'Запланировано',
      'pending_approval': 'Ожидает подтверждения',
      'checked_in': 'Отмечен приход',
      'checked_out': 'Отмечен уход',
      'on_break': 'На перерыве',
      'overtime': 'Переработка'
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

        case 'update_child_payment_status':
          return await this.handleUpdateChildPaymentStatus(aiAction);

        case 'analyze_payroll':
          return await this.handleAnalyzePayroll(aiAction);

        case 'generate_attendance_report':
          return await this.handleGenerateAttendanceReport(aiAction);

        case 'generate_child_payment_report':
          return await this.handleGenerateChildPaymentReport(aiAction);

        case 'get_overdue_tasks':
          return await this.handleGetOverdueTasks(aiAction);

        case 'update_task_status':
          return await this.handleUpdateTaskStatus(aiAction);

        case 'generate_rent_report':
          return await this.handleGenerateRentReport(aiAction);

        case 'update_rent_payment_status':
          return await this.handleUpdateRentPaymentStatus(aiAction);

        case 'check_product_alerts':
          return await this.handleCheckProductAlerts();

        case 'get_today_menu':
          return await this.handleGetTodayMenu(aiAction);

        case 'get_child_info':
          return await this.handleGetChildInfo(aiAction);

        case 'get_staff_summary':
          return await this.handleGetStaffSummary(aiAction);

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

      case 'update_child_payment_status': {
        if (!pendingAction.paymentData) {
          return { content: 'Ошибка: данные оплаты не найдены.', action: 'text' };
        }

        const { paymentId, newStatus, paidAmount } = pendingAction.paymentData;

        try {
          const payment = await ChildPayment.findById(paymentId);
          if (!payment) {
            return { content: 'Платёж не найден. Возможно, он был удалён.', action: 'text' };
          }

          payment.status = newStatus;
          if (newStatus === 'paid') {
            payment.paidAmount = paidAmount || payment.amount;
            payment.paymentDate = new Date();
          } else {
            payment.paidAmount = 0;
            payment.paymentDate = undefined as any;
          }
          payment.updatedAt = new Date();
          await payment.save();

          const statusText = newStatus === 'paid' ? 'Оплачено' : 'Активен (неоплачено)';
          const childName = pendingAction.paymentData.childName || 'ребёнка';
          const period = this.translateMonthPeriod(pendingAction.paymentData.monthPeriod);

          return {
            content: `Статус оплаты за ${childName} за ${period} изменён на "${statusText}".${newStatus === 'paid' ? ` Сумма: ${Number(payment.paidAmount).toLocaleString('ru-RU')} тг.` : ''}`,
            action: 'text'
          };
        } catch (error: any) {
          console.error('Ошибка при обновлении статуса оплаты:', error);
          return { content: 'Не удалось обновить статус оплаты. Попробуйте позже.', action: 'text' };
        }
      }

      case 'update_task_status': {
        if (!pendingAction.taskData) {
          return { content: 'Ошибка: данные задачи не найдены.', action: 'text' };
        }

        const { taskId: tId, newStatus: tStatus } = pendingAction.taskData;

        try {
          const task = await Task.findById(tId);
          if (!task) {
            return { content: 'Задача не найдена. Возможно, она была удалена.', action: 'text' };
          }

          task.status = tStatus;
          if (tStatus === 'completed') {
            task.completedAt = new Date();
            if (authContext?.userId) task.completedBy = authContext.userId as any;
          } else if (tStatus === 'cancelled') {
            task.cancelledAt = new Date();
            if (authContext?.userId) task.cancelledBy = authContext.userId as any;
          }
          await task.save();

          return {
            content: `Статус задачи "${pendingAction.taskData.taskTitle}" изменён на "${this.translateStatus(tStatus)}".`,
            action: 'text'
          };
        } catch (error: any) {
          console.error('Ошибка при обновлении задачи:', error);
          return { content: 'Не удалось обновить задачу. Попробуйте позже.', action: 'text' };
        }
      }

      case 'update_rent_payment_status': {
        if (!pendingAction.rentData) {
          return { content: 'Ошибка: данные аренды не найдены.', action: 'text' };
        }

        const { rentId, newStatus: rStatus, paidAmount: rAmount } = pendingAction.rentData;

        try {
          const rent = await Rent.findById(rentId);
          if (!rent) {
            return { content: 'Платёж за аренду не найден.', action: 'text' };
          }

          rent.status = rStatus;
          if (rStatus === 'paid') {
            rent.paidAmount = rAmount || rent.total;
            rent.paymentDate = new Date();
          } else {
            rent.paidAmount = 0;
            rent.paymentDate = undefined as any;
          }
          await rent.save();

          const statusText = rStatus === 'paid' ? 'Оплачено' : 'Активен (неоплачено)';
          const tenantName = pendingAction.rentData.tenantName || 'арендатора';
          const period = this.translateMonthPeriod(pendingAction.rentData.period);

          return {
            content: `Статус оплаты аренды за ${tenantName} за ${period} изменён на "${statusText}".${rStatus === 'paid' ? ` Сумма: ${Number(rent.paidAmount).toLocaleString('ru-RU')} тг.` : ''}`,
            action: 'text'
          };
        } catch (error: any) {
          console.error('Ошибка при обновлении аренды:', error);
          return { content: 'Не удалось обновить статус аренды. Попробуйте позже.', action: 'text' };
        }
      }

      default:
        return { content: 'Неизвестный тип действия.', action: 'text' };
    }
  }

  // ===== НОВЫЕ ОБРАБОТЧИКИ СПЕЦИАЛИЗИРОВАННЫХ ДЕЙСТВИЙ =====

  /**
   * Изменение статуса оплаты ребёнка (требует подтверждения)
   */
  private static async handleUpdateChildPaymentStatus(aiAction: AIAction): Promise<ServiceResponse> {
    const { childName, monthPeriod, newStatus, paidAmount } = aiAction;

    if (!childName || !monthPeriod || !newStatus) {
      return { content: 'Не удалось определить ребёнка, период или новый статус. Уточните запрос.', action: 'text' };
    }

    try {
      const children = await Child.find({
        fullName: { $regex: escapeRegex(childName), $options: 'i' },
        active: true
      }).limit(5);

      if (children.length === 0) {
        return { content: `Ребёнок с именем "${childName}" не найден среди активных.`, action: 'text' };
      }

      if (children.length > 1) {
        const names = children.map((c: any, i: number) => `${i + 1}. ${c.fullName}`).join('\n');
        return { content: `Найдено несколько детей:\n${names}\n\nУточните полное имя ребёнка.`, action: 'text' };
      }

      const child = children[0];
      const payment = await ChildPayment.findOne({ childId: child._id, monthPeriod });

      if (!payment) {
        return { content: `Платёж за ${child.fullName} за ${this.translateMonthPeriod(monthPeriod)} не найден.`, action: 'text' };
      }

      if (payment.status === newStatus) {
        const statusText = this.translateStatus(newStatus);
        return { content: `Статус оплаты за ${child.fullName} уже "${statusText}".`, action: 'text' };
      }

      const pendingId = crypto.randomUUID();
      const statusText = newStatus === 'paid' ? 'Оплачено' : 'Активен (неоплачено)';
      const amount = paidAmount || (child as any).paymentAmount || payment.amount;
      const period = this.translateMonthPeriod(monthPeriod);

      const description = `Изменить статус оплаты за ${child.fullName} за ${period}\nТекущий статус: ${this.translateStatus(payment.status)}\nНовый статус: ${statusText}${newStatus === 'paid' ? `\nСумма оплаты: ${Number(amount).toLocaleString('ru-RU')} тг` : ''}`;

      const pendingAction: PendingAction = {
        id: pendingId,
        type: 'update_child_payment_status',
        description,
        paymentData: {
          childName: child.fullName,
          childId: child._id.toString(),
          paymentId: payment._id.toString(),
          monthPeriod,
          newStatus,
          paidAmount: amount
        }
      };

      return {
        content: `Для изменения статуса оплаты требуется ваше подтверждение:\n\n${description}\n\nПодтвердите или отмените действие.`,
        action: 'confirm_action',
        pendingAction
      };
    } catch (error: any) {
      console.error('Ошибка в handleUpdateChildPaymentStatus:', error);
      return { content: 'Не удалось найти данные об оплате. Попробуйте позже.', action: 'text' };
    }
  }

  /**
   * Анализ зарплаты сотрудника (read-only, без подтверждения)
   */
  private static async handleAnalyzePayroll(aiAction: AIAction): Promise<ServiceResponse> {
    const { staffName, period } = aiAction;

    if (!staffName) {
      return { content: 'Укажите имя сотрудника для анализа зарплаты.', action: 'text' };
    }

    const targetPeriod = period || this.getCurrentPeriod();

    try {
      const users = await User.find({
        fullName: { $regex: escapeRegex(staffName), $options: 'i' },
        active: true
      }).limit(5);

      if (users.length === 0) {
        return { content: `Сотрудник "${staffName}" не найден.`, action: 'text' };
      }

      if (users.length > 1) {
        const names = users.map((u: any, i: number) => `${i + 1}. ${u.fullName} (${this.translateRole(u.role)})`).join('\n');
        return { content: `Найдено несколько сотрудников:\n${names}\n\nУточните полное имя.`, action: 'text' };
      }

      const user = users[0];
      const payroll = await Payroll.findOne({ staffId: user._id, period: targetPeriod });

      if (!payroll) {
        return { content: `Зарплатная ведомость для ${user.fullName} за ${this.translateMonthPeriod(targetPeriod)} не найдена.`, action: 'text' };
      }

      const report = this.formatPayrollBreakdown(payroll, user);
      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleAnalyzePayroll:', error);
      return { content: 'Не удалось загрузить данные зарплаты. Попробуйте позже.', action: 'text' };
    }
  }

  /**
   * Отчёт по посещаемости сотрудников (read-only)
   */
  private static async handleGenerateAttendanceReport(aiAction: AIAction): Promise<ServiceResponse> {
    try {
      const targetDate = aiAction.date || aiAction.startDate || this.getCurrentDateStr();
      const endDate = aiAction.endDate;

      const query: any = {};
      if (endDate) {
        query.date = { $gte: new Date(targetDate), $lte: new Date(endDate) };
      } else {
        const dayStart = new Date(targetDate);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        query.date = { $gte: dayStart, $lt: dayEnd };
      }

      const records = await StaffAttendanceTracking.find(query)
        .populate('staffId', 'fullName role')
        .sort({ date: -1 })
        .limit(200);

      if (records.length === 0) {
        return { content: `Нет данных о посещаемости за ${this.translateDateStr(targetDate)}.`, action: 'text' };
      }

      const report = this.formatAttendanceReport(records, targetDate, endDate);
      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGenerateAttendanceReport:', error);
      return { content: 'Не удалось сформировать отчёт по посещаемости.', action: 'text' };
    }
  }

  /**
   * Отчёт по оплатам за детей (read-only)
   */
  private static async handleGenerateChildPaymentReport(aiAction: AIAction): Promise<ServiceResponse> {
    const targetPeriod = aiAction.monthPeriod || this.getCurrentPeriod();

    try {
      const query: any = { monthPeriod: targetPeriod };
      if (aiAction.statusFilter) {
        query.status = aiAction.statusFilter;
      }

      const payments = await ChildPayment.find(query).populate('childId', 'fullName groupId');

      if (payments.length === 0) {
        const statusText = aiAction.statusFilter ? ` со статусом "${this.translateStatus(aiAction.statusFilter)}"` : '';
        return { content: `Платежей за ${this.translateMonthPeriod(targetPeriod)}${statusText} не найдено.`, action: 'text' };
      }

      const report = this.formatPaymentReport(payments, targetPeriod);
      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGenerateChildPaymentReport:', error);
      return { content: 'Не удалось сформировать отчёт по оплатам.', action: 'text' };
    }
  }

  // ===== НОВЫЕ ОБРАБОТЧИКИ (8 действий) =====

  /**
   * Получить просроченные/активные задачи
   */
  private static async handleGetOverdueTasks(aiAction: AIAction): Promise<ServiceResponse> {
    try {
      const query: any = { status: { $in: ['pending', 'in_progress'] } };

      if (aiAction.priority) {
        query.priority = aiAction.priority;
      }

      const tasks = await Task.find(query)
        .populate('assignedTo', 'fullName role')
        .populate('assignedBy', 'fullName')
        .sort({ dueDate: 1, priority: -1 })
        .limit(30);

      if (tasks.length === 0) {
        return { content: 'Нет активных или просроченных задач.', action: 'text' };
      }

      const now = new Date();
      const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now);
      const upcoming = tasks.filter((t: any) => !t.dueDate || new Date(t.dueDate) >= now);

      let report = `Задачи — всего активных: ${tasks.length}\n`;
      if (overdue.length > 0) report += `Просрочено: ${overdue.length}\n`;
      report += '\n';

      if (overdue.length > 0) {
        report += '--- Просроченные ---\n';
        overdue.forEach((t: any, i: number) => {
          const assignee = t.assignedTo?.fullName || 'не назначен';
          const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString('ru-RU') : '—';
          const priorityMap: Record<string, string> = { urgent: 'Срочно', high: 'Высокий', medium: 'Средний', low: 'Низкий' };
          report += `${i + 1}. ${t.title} [${priorityMap[t.priority] || t.priority}]\n   Исполнитель: ${assignee}, срок: ${due}\n`;
        });
      }

      if (upcoming.length > 0) {
        report += '\n--- Текущие ---\n';
        upcoming.slice(0, 15).forEach((t: any, i: number) => {
          const assignee = t.assignedTo?.fullName || 'не назначен';
          const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString('ru-RU') : 'без срока';
          const statusText = this.translateStatus(t.status);
          report += `${i + 1}. ${t.title} — ${statusText}\n   Исполнитель: ${assignee}, срок: ${due}\n`;
        });
        if (upcoming.length > 15) report += `... и ещё ${upcoming.length - 15} задач\n`;
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGetOverdueTasks:', error);
      return { content: 'Не удалось загрузить задачи. Попробуйте позже.', action: 'text' };
    }
  }

  /**
   * Изменение статуса задачи (требует подтверждения)
   */
  private static async handleUpdateTaskStatus(aiAction: AIAction): Promise<ServiceResponse> {
    const { taskId, taskStatus, childName: taskTitle } = aiAction;

    if (!taskStatus) {
      return { content: 'Укажите новый статус задачи (выполнена, в работе, отменена).', action: 'text' };
    }

    try {
      let task: any = null;

      if (taskId) {
        task = await Task.findById(taskId);
      } else if (taskTitle) {
        const tasks = await Task.find({
          title: { $regex: escapeRegex(taskTitle), $options: 'i' },
          status: { $in: ['pending', 'in_progress'] }
        }).limit(5);

        if (tasks.length === 0) {
          return { content: `Задача "${taskTitle}" не найдена среди активных.`, action: 'text' };
        }
        if (tasks.length > 1) {
          const list = tasks.map((t: any, i: number) => `${i + 1}. ${t.title} (${this.translateStatus(t.status)})`).join('\n');
          return { content: `Найдено несколько задач:\n${list}\n\nУточните название задачи.`, action: 'text' };
        }
        task = tasks[0];
      } else {
        return { content: 'Укажите ID или название задачи.', action: 'text' };
      }

      if (!task) {
        return { content: 'Задача не найдена.', action: 'text' };
      }

      const pendingId = crypto.randomUUID();
      const statusMap: Record<string, string> = { completed: 'Выполнена', in_progress: 'В работе', cancelled: 'Отменена' };
      const description = `Изменить статус задачи "${task.title}"\nТекущий статус: ${this.translateStatus(task.status)}\nНовый статус: ${statusMap[taskStatus] || taskStatus}`;

      const pendingAction: PendingAction = {
        id: pendingId,
        type: 'update_task_status',
        description,
        taskData: {
          taskId: task._id.toString(),
          taskTitle: task.title,
          newStatus: taskStatus
        }
      };

      return {
        content: `Для изменения задачи требуется подтверждение:\n\n${description}\n\nПодтвердите или отмените действие.`,
        action: 'confirm_action',
        pendingAction
      };
    } catch (error: any) {
      console.error('Ошибка в handleUpdateTaskStatus:', error);
      return { content: 'Не удалось найти задачу. Попробуйте позже.', action: 'text' };
    }
  }

  /**
   * Отчёт по арендным платежам (read-only)
   */
  private static async handleGenerateRentReport(aiAction: AIAction): Promise<ServiceResponse> {
    const targetPeriod = aiAction.rentPeriod || aiAction.monthPeriod || this.getCurrentPeriod();

    try {
      const query: any = { period: targetPeriod };
      if (aiAction.statusFilter) {
        query.status = aiAction.statusFilter;
      }

      const rents = await Rent.find(query).populate('tenantId', 'name phone type');

      if (rents.length === 0) {
        const statusText = aiAction.statusFilter ? ` со статусом "${this.translateStatus(aiAction.statusFilter)}"` : '';
        return { content: `Арендных платежей за ${this.translateMonthPeriod(targetPeriod)}${statusText} не найдено.`, action: 'text' };
      }

      const period = this.translateMonthPeriod(targetPeriod);
      let report = `Отчёт по аренде за ${period}\n\n`;

      const paid = rents.filter((r: any) => r.status === 'paid');
      const active = rents.filter((r: any) => r.status === 'active');
      const overdue = rents.filter((r: any) => r.status === 'overdue');

      const sum = (arr: any[]) => arr.reduce((s: number, r: any) => s + (r.total || r.amount || 0), 0);

      report += `Всего: ${rents.length}\n`;
      report += `Оплачено: ${paid.length} (${Number(sum(paid)).toLocaleString('ru-RU')} тг)\n`;
      report += `Не оплачено: ${active.length} (${Number(sum(active)).toLocaleString('ru-RU')} тг)\n`;
      if (overdue.length > 0) report += `Просрочено: ${overdue.length} (${Number(sum(overdue)).toLocaleString('ru-RU')} тг)\n`;

      const unpaid = [...active, ...overdue];
      if (unpaid.length > 0) {
        report += '\n--- Неоплаченные ---\n';
        unpaid.forEach((r: any, i: number) => {
          const name = r.tenantId?.name || 'Неизвестный';
          const amount = Number(r.total || r.amount || 0).toLocaleString('ru-RU');
          const status = this.translateStatus(r.status);
          report += `${i + 1}. ${name} — ${amount} тг (${status})\n`;
        });
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGenerateRentReport:', error);
      return { content: 'Не удалось сформировать отчёт по аренде.', action: 'text' };
    }
  }

  /**
   * Изменение статуса арендного платежа (требует подтверждения)
   */
  private static async handleUpdateRentPaymentStatus(aiAction: AIAction): Promise<ServiceResponse> {
    const { tenantName, rentPeriod, rentStatus, rentAmount } = aiAction;

    if (!tenantName || !rentStatus) {
      return { content: 'Укажите имя арендатора и новый статус.', action: 'text' };
    }

    const targetPeriod = rentPeriod || aiAction.monthPeriod || this.getCurrentPeriod();

    try {
      const specialists = await ExternalSpecialist.find({
        name: { $regex: escapeRegex(tenantName), $options: 'i' },
        active: true
      }).limit(5);

      if (specialists.length === 0) {
        return { content: `Арендатор "${tenantName}" не найден.`, action: 'text' };
      }

      if (specialists.length > 1) {
        const names = specialists.map((s: any, i: number) => `${i + 1}. ${s.name}`).join('\n');
        return { content: `Найдено несколько арендаторов:\n${names}\n\nУточните имя.`, action: 'text' };
      }

      const specialist = specialists[0];
      const rent = await Rent.findOne({ tenantId: specialist._id, period: targetPeriod });

      if (!rent) {
        return { content: `Платёж за аренду для ${specialist.name} за ${this.translateMonthPeriod(targetPeriod)} не найден.`, action: 'text' };
      }

      if (rent.status === rentStatus) {
        return { content: `Статус аренды для ${specialist.name} уже "${this.translateStatus(rentStatus)}".`, action: 'text' };
      }

      const pendingId = crypto.randomUUID();
      const statusText = rentStatus === 'paid' ? 'Оплачено' : 'Активен (неоплачено)';
      const amount = rentAmount || rent.total;
      const period = this.translateMonthPeriod(targetPeriod);

      const description = `Изменить статус аренды для ${specialist.name} за ${period}\nТекущий статус: ${this.translateStatus(rent.status)}\nНовый статус: ${statusText}${rentStatus === 'paid' ? `\nСумма: ${Number(amount).toLocaleString('ru-RU')} тг` : ''}`;

      const pendingAction: PendingAction = {
        id: pendingId,
        type: 'update_rent_payment_status',
        description,
        rentData: {
          tenantName: specialist.name,
          rentId: rent._id.toString(),
          period: targetPeriod,
          newStatus: rentStatus,
          paidAmount: amount
        }
      };

      return {
        content: `Для изменения аренды требуется подтверждение:\n\n${description}\n\nПодтвердите или отмените действие.`,
        action: 'confirm_action',
        pendingAction
      };
    } catch (error: any) {
      console.error('Ошибка в handleUpdateRentPaymentStatus:', error);
      return { content: 'Не удалось найти данные аренды. Попробуйте позже.', action: 'text' };
    }
  }

  /**
   * Проверка просроченных продуктов и низкого запаса (read-only)
   */
  private static async handleCheckProductAlerts(): Promise<ServiceResponse> {
    try {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Просроченные или истекающие в течение недели
      const expiring = await Product.find({
        status: 'active',
        expirationDate: { $lte: weekLater }
      }).sort({ expirationDate: 1 }).limit(30);

      // Низкий запас (stockQuantity <= minStockLevel)
      const lowStock = await Product.find({
        status: 'active',
        $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
      }).sort({ stockQuantity: 1 }).limit(30);

      if (expiring.length === 0 && lowStock.length === 0) {
        return { content: 'Все продукты в порядке: нет просроченных и низких запасов.', action: 'text' };
      }

      let report = 'Оповещения по продуктам\n\n';

      if (expiring.length > 0) {
        const expired = expiring.filter((p: any) => p.expirationDate && new Date(p.expirationDate) <= now);
        const soonExpiring = expiring.filter((p: any) => p.expirationDate && new Date(p.expirationDate) > now);

        if (expired.length > 0) {
          report += `--- Просрочено (${expired.length}) ---\n`;
          expired.forEach((p: any, i: number) => {
            const date = new Date(p.expirationDate).toLocaleDateString('ru-RU');
            report += `${i + 1}. ${p.name} — истёк ${date} (остаток: ${p.stockQuantity} ${p.unit})\n`;
          });
        }

        if (soonExpiring.length > 0) {
          report += `\n--- Истекает в ближайшую неделю (${soonExpiring.length}) ---\n`;
          soonExpiring.forEach((p: any, i: number) => {
            const date = new Date(p.expirationDate).toLocaleDateString('ru-RU');
            report += `${i + 1}. ${p.name} — до ${date} (остаток: ${p.stockQuantity} ${p.unit})\n`;
          });
        }
      }

      if (lowStock.length > 0) {
        report += `\n--- Низкий запас (${lowStock.length}) ---\n`;
        lowStock.forEach((p: any, i: number) => {
          report += `${i + 1}. ${p.name} — ${p.stockQuantity} ${p.unit} (минимум: ${p.minStockLevel} ${p.unit})\n`;
        });
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleCheckProductAlerts:', error);
      return { content: 'Не удалось проверить запасы продуктов.', action: 'text' };
    }
  }

  /**
   * Меню на сегодня (read-only)
   */
  private static async handleGetTodayMenu(aiAction: AIAction): Promise<ServiceResponse> {
    try {
      const targetDate = aiAction.date || this.getCurrentDateStr();
      const dayStart = new Date(targetDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const menu = await DailyMenu.findOne({
        date: { $gte: dayStart, $lt: dayEnd }
      }).populate({
        path: 'meals.breakfast.dishes meals.lunch.dishes meals.snack.dishes meals.dinner.dishes',
        select: 'name category'
      });

      if (!menu) {
        return { content: `Меню на ${this.translateDateStr(targetDate)} не составлено.`, action: 'text' };
      }

      const dateLabel = this.translateDateStr(targetDate);
      let report = `Меню на ${dateLabel}\n`;
      if (menu.totalChildCount) report += `Количество детей: ${menu.totalChildCount}\n`;
      report += '\n';

      const mealNames: Record<string, string> = {
        breakfast: 'Завтрак',
        lunch: 'Обед',
        snack: 'Полдник',
        dinner: 'Ужин'
      };

      for (const [key, label] of Object.entries(mealNames)) {
        const meal = (menu.meals as any)?.[key];
        if (meal && meal.dishes && meal.dishes.length > 0) {
          const dishes = meal.dishes.map((d: any) => d.name || d).filter(Boolean);
          if (dishes.length > 0) {
            report += `${label}: ${dishes.join(', ')}\n`;
            if (meal.childCount) report += `  (детей: ${meal.childCount})\n`;
          }
        }
      }

      if (menu.notes) {
        report += `\nПримечание: ${menu.notes}`;
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGetTodayMenu:', error);
      return { content: 'Не удалось загрузить меню.', action: 'text' };
    }
  }

  /**
   * Информация о ребёнке (read-only)
   */
  private static async handleGetChildInfo(aiAction: AIAction): Promise<ServiceResponse> {
    const childName = aiAction.childName;

    if (!childName) {
      return { content: 'Укажите имя ребёнка.', action: 'text' };
    }

    try {
      const children = await Child.find({
        fullName: { $regex: escapeRegex(childName), $options: 'i' }
      }).populate('groupId', 'name').limit(5);

      if (children.length === 0) {
        return { content: `Ребёнок "${childName}" не найден.`, action: 'text' };
      }

      if (children.length > 1) {
        const names = children.map((c: any, i: number) => `${i + 1}. ${c.fullName}`).join('\n');
        return { content: `Найдено несколько детей:\n${names}\n\nУточните полное имя.`, action: 'text' };
      }

      const c = children[0] as any;
      let report = `Карточка ребёнка: ${c.fullName}\n\n`;

      if (c.birthday) report += `Дата рождения: ${new Date(c.birthday).toLocaleDateString('ru-RU')}\n`;
      if (c.gender) report += `Пол: ${c.gender === 'male' ? 'Мальчик' : 'Девочка'}\n`;
      if (c.iin) report += `ИИН: ${c.iin}\n`;
      const groupName = c.groupId?.name || '—';
      report += `Группа: ${groupName}\n`;
      report += `Статус: ${c.active ? 'Активен' : 'Неактивен'}\n`;

      report += `\n--- Родитель ---\n`;
      if (c.parentName) report += `ФИО: ${c.parentName}\n`;
      if (c.parentPhone) report += `Телефон: ${c.parentPhone}\n`;
      if (c.address) report += `Адрес: ${c.address}\n`;

      const hasMedical = c.bloodGroup || c.allergy || c.diagnosis || c.disability || c.clinic;
      if (hasMedical) {
        report += `\n--- Медицинские данные ---\n`;
        if (c.clinic) report += `Поликлиника: ${c.clinic}\n`;
        if (c.bloodGroup) report += `Группа крови: ${c.bloodGroup}${c.rhesus ? ` (${c.rhesus})` : ''}\n`;
        if (c.allergy) report += `Аллергия: ${c.allergy}\n`;
        if (c.diagnosis) report += `Диагноз: ${c.diagnosis}\n`;
        if (c.disability) report += `Инвалидность: ${c.disability}\n`;
      }

      if (c.paymentAmount) {
        report += `\nОплата: ${Number(c.paymentAmount).toLocaleString('ru-RU')} тг/мес`;
      }

      if (c.notes) {
        report += `\nПримечания: ${c.notes}`;
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGetChildInfo:', error);
      return { content: 'Не удалось загрузить данные ребёнка.', action: 'text' };
    }
  }

  /**
   * Сводка по персоналу на сегодня (read-only)
   */
  private static async handleGetStaffSummary(aiAction: AIAction): Promise<ServiceResponse> {
    try {
      const targetDate = aiAction.date || this.getCurrentDateStr();
      const dateKey = targetDate; // формат YYYY-MM-DD

      // Получаем все смены на сегодня
      const shifts = await Shift.find({
        [`shifts.${dateKey}`]: { $exists: true }
      }).populate('staffId', 'fullName role phone');

      // Получаем посещаемость на сегодня
      const dayStart = new Date(targetDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const attendance = await StaffAttendanceTracking.find({
        date: { $gte: dayStart, $lt: dayEnd }
      }).populate('staffId', 'fullName role');

      const totalStaff = await User.countDocuments({ active: true, role: { $nin: ['admin', 'parent', 'child'] } });

      let report = `Сводка по персоналу на ${this.translateDateStr(targetDate)}\n\n`;
      report += `Всего активных сотрудников: ${totalStaff}\n`;

      if (shifts.length > 0) {
        const scheduled = shifts.filter((s: any) => {
          const dayShift = s.shifts?.get(dateKey);
          return dayShift && dayShift.status !== 'absent';
        });
        const absent = shifts.filter((s: any) => {
          const dayShift = s.shifts?.get(dateKey);
          return dayShift && dayShift.status === 'absent';
        });

        report += `Запланировано смен: ${scheduled.length}\n`;
        if (absent.length > 0) report += `Отсутствуют по расписанию: ${absent.length}\n`;

        if (scheduled.length > 0) {
          report += '\n--- На смене ---\n';
          scheduled.forEach((s: any, i: number) => {
            const name = s.staffId?.fullName || 'Неизвестный';
            const role = s.staffId?.role ? this.translateRole(s.staffId.role) : '';
            report += `${i + 1}. ${name}${role ? ` (${role})` : ''}\n`;
          });
        }
      }

      if (attendance.length > 0) {
        const late = attendance.filter((a: any) => a.lateMinutes > 0 || a.status === 'late');
        const absentAtt = attendance.filter((a: any) => a.status === 'absent');

        report += `\nОтмечено приход: ${attendance.length}\n`;
        if (late.length > 0) {
          report += `Опоздали: ${late.length}\n`;
          late.forEach((a: any, i: number) => {
            const name = a.staffId?.fullName || 'Неизвестный';
            report += `  ${i + 1}. ${name} — ${a.lateMinutes || 0} мин\n`;
          });
        }
        if (absentAtt.length > 0) {
          report += `Не вышли: ${absentAtt.length}\n`;
          absentAtt.forEach((a: any, i: number) => {
            const name = a.staffId?.fullName || 'Неизвестный';
            report += `  ${i + 1}. ${name}\n`;
          });
        }
      } else if (shifts.length === 0) {
        report += '\nДанные о сменах и посещаемости на эту дату отсутствуют.';
      }

      return { content: report, action: 'text' };
    } catch (error: any) {
      console.error('Ошибка в handleGetStaffSummary:', error);
      return { content: 'Не удалось загрузить сводку по персоналу.', action: 'text' };
    }
  }

  // ===== ФОРМАТИРОВАНИЕ ОТЧЁТОВ =====

  /**
   * Детальный разбор зарплаты
   */
  private static formatPayrollBreakdown(payroll: any, user: any): string {
    const p = payroll;
    const period = this.translateMonthPeriod(p.period);
    const role = this.translateRole(user.role);
    const salaryType = p.baseSalaryType === 'shift' ? 'за смену' : 'в месяц';

    let report = `Зарплата: ${user.fullName} (${role}) за ${period}\n`;
    report += `Статус: ${this.translateStatus(p.status)}\n\n`;

    report += `Оклад: ${Number(p.baseSalary || 0).toLocaleString('ru-RU')} тг ${salaryType}\n`;
    if (p.baseSalaryType === 'shift' && p.shiftRate) {
      report += `Ставка за смену: ${Number(p.shiftRate).toLocaleString('ru-RU')} тг\n`;
    }
    report += `Отработано: ${p.workedShifts || 0} смен / ${p.workedDays || 0} дней\n\n`;

    report += `--- Начисления ---\n`;
    report += `Начислено: ${Number(p.accruals || 0).toLocaleString('ru-RU')} тг\n`;
    if (p.bonuses) report += `Бонусы: +${Number(p.bonuses).toLocaleString('ru-RU')} тг\n`;

    const hasDeductions = (p.latePenalties || p.absencePenalties || p.userFines || p.advance || p.deductions || p.carryOverDebt);
    if (hasDeductions) {
      report += `\n--- Вычеты ---\n`;
      if (p.latePenalties) report += `Штрафы за опоздания: -${Number(p.latePenalties).toLocaleString('ru-RU')} тг\n`;
      if (p.absencePenalties) report += `Штрафы за прогулы: -${Number(p.absencePenalties).toLocaleString('ru-RU')} тг\n`;
      if (p.userFines) report += `Ручные штрафы: -${Number(p.userFines).toLocaleString('ru-RU')} тг\n`;
      if (p.advance) report += `Аванс: -${Number(p.advance).toLocaleString('ru-RU')} тг\n`;
      if (p.deductions) report += `Вычеты: -${Number(p.deductions).toLocaleString('ru-RU')} тг\n`;
      if (p.carryOverDebt) report += `Долг с пред. месяца: -${Number(p.carryOverDebt).toLocaleString('ru-RU')} тг\n`;
    }

    // Список штрафов
    if (p.fines && p.fines.length > 0) {
      report += `\n--- Штрафы (${p.fines.length}) ---\n`;
      p.fines.forEach((fine: any, i: number) => {
        const fineDate = fine.date ? new Date(fine.date).toLocaleDateString('ru-RU') : '—';
        report += `${i + 1}. ${Number(fine.amount).toLocaleString('ru-RU')} тг — ${fine.reason || 'без причины'} (${fineDate})\n`;
      });
    }

    report += `\n--- Итог ---\n`;
    report += `К выплате: ${Number(p.total || 0).toLocaleString('ru-RU')} тг\n`;

    // Проверка формулы
    const expectedTotal = (p.accruals || 0) + (p.bonuses || 0)
      - (p.latePenalties || 0) - (p.absencePenalties || 0) - (p.userFines || 0)
      - (p.advance || 0) - (p.deductions || 0) - (p.carryOverDebt || 0);
    const diff = Math.abs((p.total || 0) - expectedTotal);
    if (diff > 1) {
      report += `\n⚠️ Несоответствие! Ожидаемый итог по формуле: ${Number(expectedTotal).toLocaleString('ru-RU')} тг (разница: ${Number(diff).toLocaleString('ru-RU')} тг)`;
    }

    return report;
  }

  /**
   * Отчёт по посещаемости
   */
  private static formatAttendanceReport(records: any[], dateStr: string, endDate?: string): string {
    const dateLabel = endDate ? `${this.translateDateStr(dateStr)} — ${this.translateDateStr(endDate)}` : this.translateDateStr(dateStr);
    let report = `Посещаемость сотрудников за ${dateLabel}\n\n`;

    const late = records.filter((r: any) => r.lateMinutes > 0 || r.status === 'late');
    const absent = records.filter((r: any) => r.status === 'absent');
    const present = records.filter((r: any) => ['completed', 'checked_in', 'checked_out', 'in_progress'].includes(r.status));

    report += `Всего записей: ${records.length}\n`;
    report += `На работе: ${present.length}\n`;
    report += `Опоздали: ${late.length}\n`;
    report += `Отсутствуют: ${absent.length}\n`;

    if (late.length > 0) {
      report += `\n--- Опоздания ---\n`;
      late.forEach((r: any, i: number) => {
        const name = r.staffId?.fullName || 'Неизвестный';
        const mins = r.lateMinutes || 0;
        const start = r.actualStart ? new Date(r.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—';
        report += `${i + 1}. ${name} — опоздание ${mins} мин (приход: ${start})\n`;
      });
    }

    if (absent.length > 0) {
      report += `\n--- Отсутствующие ---\n`;
      absent.forEach((r: any, i: number) => {
        const name = r.staffId?.fullName || 'Неизвестный';
        report += `${i + 1}. ${name}\n`;
      });
    }

    return report;
  }

  /**
   * Отчёт по оплатам
   */
  private static formatPaymentReport(payments: any[], monthPeriod: string): string {
    const period = this.translateMonthPeriod(monthPeriod);
    let report = `Отчёт по оплатам за ${period}\n\n`;

    const paid = payments.filter((p: any) => p.status === 'paid');
    const active = payments.filter((p: any) => p.status === 'active');
    const overdue = payments.filter((p: any) => p.status === 'overdue');
    const draft = payments.filter((p: any) => p.status === 'draft');

    const sum = (arr: any[]) => arr.reduce((s: number, p: any) => s + (p.total || p.amount || 0), 0);

    report += `Всего платежей: ${payments.length}\n`;
    report += `Оплачено: ${paid.length} (${Number(sum(paid)).toLocaleString('ru-RU')} тг)\n`;
    report += `Не оплачено: ${active.length} (${Number(sum(active)).toLocaleString('ru-RU')} тг)\n`;
    if (overdue.length > 0) report += `Просрочено: ${overdue.length} (${Number(sum(overdue)).toLocaleString('ru-RU')} тг)\n`;
    if (draft.length > 0) report += `Черновики: ${draft.length}\n`;

    const unpaid = [...active, ...overdue];
    if (unpaid.length > 0) {
      report += `\n--- Неоплаченные ---\n`;
      unpaid.forEach((p: any, i: number) => {
        const childName = p.childId?.fullName || 'Неизвестный';
        const amount = Number(p.total || p.amount || 0).toLocaleString('ru-RU');
        const status = this.translateStatus(p.status);
        report += `${i + 1}. ${childName} — ${amount} тг (${status})\n`;
      });
    }

    return report;
  }

  // ===== УТИЛИТЫ =====

  /**
   * Переводит период "2026-03" в "Март 2026"
   */
  private static translateMonthPeriod(period: string): string {
    const months: Record<string, string> = {
      '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
      '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
      '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
    };
    const [year, month] = period.split('-');
    return `${months[month] || month} ${year}`;
  }

  /**
   * Переводит дату строку в читаемый формат
   */
  private static translateDateStr(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  /**
   * Текущий период в формате YYYY-MM
   */
  private static getCurrentPeriod(): string {
    const now = new Date();
    const KZ_OFFSET_MS = 5 * 60 * 60 * 1000;
    const kz = new Date(now.getTime() + KZ_OFFSET_MS);
    return kz.toISOString().slice(0, 7);
  }

  /**
   * Текущая дата в формате YYYY-MM-DD
   */
  private static getCurrentDateStr(): string {
    const now = new Date();
    const KZ_OFFSET_MS = 5 * 60 * 60 * 1000;
    const kz = new Date(now.getTime() + KZ_OFFSET_MS);
    return kz.toISOString().slice(0, 10);
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
