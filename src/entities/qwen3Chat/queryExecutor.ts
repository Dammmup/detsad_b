import mongoose from 'mongoose';

// Разрешённые коллекции (только чтение)
const ALLOWED_COLLECTIONS = [
    'users',
    'children',
    'groups',
    'staff_attendance_tracking',
    'childattendances',
    'payrolls',
    'staff_shifts',
    'tasks',
    'documents',
    'reports',
    'settings',
    'holidays',
    'health_passports',
    'mantoux_journal',
    'somatic_journal',
    'helminth_journal',
    'tub_positive_journal',
    'infectious_diseases_journal',
    'contact_infection_journal',
    'risk_group_children',
    'menu_items',
    'food_stock_log',
    'food_staff_health',
    'food_norms_control',
    'detergent_log',
    'product_certificates',
    'organoleptic_journal',
    'perishable_brak',
    'products',
    'dishes',
    'daily_menus',
    'weekly_menu_templates',
    'product_purchases',
    'child_payments',
    'rent_payments',
    'main_events'
];

// Разрешённые операции (только чтение)
const ALLOWED_OPERATIONS = ['find', 'findOne', 'count', 'countDocuments', 'aggregate'];

// Запрещённые операторы (потенциально опасные)
const FORBIDDEN_OPERATORS = ['$where', '$function', '$accumulator', '$expr'];

// Максимальное количество документов
const MAX_LIMIT = 100;

// Таймаут в миллисекундах
const QUERY_TIMEOUT = 10000;

export interface QueryRequest {
    collection: string;
    operation: 'find' | 'findOne' | 'count' | 'countDocuments' | 'aggregate';
    filter?: Record<string, any>;
    pipeline?: Record<string, any>[];
    projection?: Record<string, any>;
    limit?: number;
    sort?: Record<string, any>;
}

export interface QueryResult {
    success: boolean;
    data?: any;
    error?: string;
    count?: number;
}

/**
 * Проверяет объект на наличие запрещённых операторов
 */
function containsForbiddenOperators(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    for (const key of Object.keys(obj)) {
        if (FORBIDDEN_OPERATORS.includes(key)) {
            return true;
        }
        if (typeof obj[key] === 'object' && containsForbiddenOperators(obj[key])) {
            return true;
        }
    }
    return false;
}

/**
 * Валидирует запрос перед выполнением
 */
function validateQuery(query: QueryRequest): { valid: boolean; error?: string } {
    // Проверка коллекции
    if (!ALLOWED_COLLECTIONS.includes(query.collection)) {
        return { valid: false, error: `Коллекция '${query.collection}' не разрешена для запросов` };
    }

    // Проверка операции
    if (!ALLOWED_OPERATIONS.includes(query.operation)) {
        return { valid: false, error: `Операция '${query.operation}' не разрешена` };
    }

    // Проверка фильтра на запрещённые операторы
    if (query.filter && containsForbiddenOperators(query.filter)) {
        return { valid: false, error: 'Запрос содержит запрещённые операторы' };
    }

    // Проверка pipeline для aggregate
    if (query.pipeline) {
        for (const stage of query.pipeline) {
            if (containsForbiddenOperators(stage)) {
                return { valid: false, error: 'Pipeline содержит запрещённые операторы' };
            }
        }
    }

    return { valid: true };
}

/**
 * Преобразует строковые даты в объекты Date
 */
function convertDates(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(convertDates);
    }

    const result: any = {};
    for (const key of Object.keys(obj)) {
        const value = obj[key];

        // Проверяем, похоже ли значение на ISO дату
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            result[key] = new Date(value);
        } else if (typeof value === 'object') {
            result[key] = convertDates(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Безопасно выполняет запрос к MongoDB
 */
export async function executeQuery(query: QueryRequest): Promise<QueryResult> {
    // Валидация
    const validation = validateQuery(query);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        const db = mongoose.connection.db;
        if (!db) {
            return { success: false, error: 'База данных не подключена' };
        }

        const collection = db.collection(query.collection);
        const filter = query.filter ? convertDates(query.filter) : {};
        const limit = Math.min(query.limit || MAX_LIMIT, MAX_LIMIT);

        let result: any;

        // Создаём промис с таймаутом
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Таймаут запроса')), QUERY_TIMEOUT);
        });

        let queryPromise: Promise<any>;

        switch (query.operation) {
            case 'find':
                queryPromise = collection
                    .find(filter)
                    .project(query.projection || {})
                    .sort(query.sort || {})
                    .limit(limit)
                    .toArray();
                break;

            case 'findOne':
                queryPromise = collection.findOne(filter, { projection: query.projection });
                break;

            case 'count':
            case 'countDocuments':
                queryPromise = collection.countDocuments(filter);
                break;

            case 'aggregate':
                if (!query.pipeline) {
                    return { success: false, error: 'Pipeline обязателен для aggregate' };
                }
                // Добавляем $limit в конец pipeline если его нет
                const pipeline = convertDates(query.pipeline);
                const hasLimit = pipeline.some((stage: any) => '$limit' in stage);
                if (!hasLimit) {
                    pipeline.push({ $limit: limit });
                }
                queryPromise = collection.aggregate(pipeline).toArray();
                break;

            default:
                return { success: false, error: `Неподдерживаемая операция: ${query.operation}` };
        }

        result = await Promise.race([queryPromise, timeoutPromise]);

        // Для count возвращаем число
        if (query.operation === 'count' || query.operation === 'countDocuments') {
            return { success: true, data: result, count: result };
        }

        return { success: true, data: result };

    } catch (error: any) {
        console.error('Ошибка выполнения запроса:', error);
        return { success: false, error: error.message || 'Ошибка выполнения запроса' };
    }
}

/**
 * Получает список всех коллекций для справки
 */
export function getAllowedCollections(): string[] {
    return [...ALLOWED_COLLECTIONS];
}
