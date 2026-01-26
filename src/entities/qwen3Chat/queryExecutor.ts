import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Разрешённые коллекции для операций
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

// Разрешённые операции (чтение и запись)
const ALLOWED_OPERATIONS = [
    // Чтение
    'find', 'findOne', 'count', 'countDocuments', 'aggregate',
    // Запись
    'insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'
];

// Операции записи (требуют особой осторожности)
const WRITE_OPERATIONS = ['insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];

// Запрещённые операторы (потенциально опасные)
const FORBIDDEN_OPERATORS = ['$where', '$function', '$accumulator', '$expr'];

// Максимальное количество документов
const MAX_LIMIT = 100;

// Таймаут в миллисекундах
const QUERY_TIMEOUT = 10000;

export interface QueryRequest {
    collection: string;
    operation: 'find' | 'findOne' | 'count' | 'countDocuments' | 'aggregate' | 'insertOne' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany';
    filter?: Record<string, any>;
    pipeline?: Record<string, any>[];
    projection?: Record<string, any>;
    limit?: number;
    sort?: Record<string, any>;
    // Для операций записи
    document?: Record<string, any>;  // Для insertOne
    update?: Record<string, any>;    // Для updateOne/updateMany
    upsert?: boolean;               // Для updateOne/updateMany
    // Контекст безопасности
    authContext?: {
        userId: string;
        role: string;
        groupId?: string;
    };
}

export interface QueryResult {
    success: boolean;
    data?: any;
    error?: string;
    count?: number;
    message?: string;  // Для CRUD операций
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
 * Преобразует специальные типы MongoDB (даты и ObjectId) из строкового формата
 */
function convertMongoTypes(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(convertMongoTypes);
    }

    const result: any = {};
    for (const key of Object.keys(obj)) {
        const value = obj[key];

        // 1. Проверка на $oid (ObjectId)
        if (value && typeof value === 'object' && value.$oid) {
            result[key] = new mongoose.Types.ObjectId(value.$oid);
        }
        // 2. Проверка, похоже ли значение на ISO дату
        else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            result[key] = new Date(value);
        }
        // 3. Рекурсивный обход
        else if (typeof value === 'object') {
            result[key] = convertMongoTypes(value);
        } else {
            result[key] = value;
        }
    }
    return result;
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
 * Применяет ограничения безопасности к фильтру или pipeline в зависимости от роли
 */
function applySecurityFilters(query: QueryRequest): void {
    if (!query.authContext) return;

    const { userId, role, groupId } = query.authContext;
    const isAdmin = role === 'admin' || role === 'manager' || role === 'director';

    if (isAdmin) return; // Админам не ограничиваем на уровне исполнителя

    console.log(`🛡️ Применение безопасности для роли ${role}, userId: ${userId}`);

    // Инициализируем фильтр если его нет
    if (!query.filter) query.filter = {};

    switch (query.collection) {
        case 'payrolls':
        case 'staff_attendance_tracking':
        case 'staff_shifts':
            // Сотрудник видит только свои записи
            query.filter.staffId = userId;
            break;

        case 'children':
            // Воспитатель видит только свою группу (если она указана)
            if ((role === 'teacher' || role === 'assistant') && groupId) {
                query.filter.groupId = groupId;
            }
            break;

        case 'childattendances':
            // Воспитатель видит посещаемость только своей группы
            if ((role === 'teacher' || role === 'assistant') && groupId) {
                query.filter.groupId = groupId;
            }
            break;

        case 'users':
            // Обычный пользователь видит только себя (или вообще не видит других)
            query.filter._id = userId;
            break;

        case 'settings':
        case 'reports':
        case 'statistics':
            // Для не-админов ограничиваем доступ к этим коллекциям (выдаем пустой результат)
            query.filter._id = '000000000000000000000000'; // Несуществующий ID
            break;
    }

    // Если это агрегация, добавляем $match в начало pipeline
    if (query.operation === 'aggregate' && query.pipeline) {
        const securityMatch: any = { $match: { ...query.filter } };
        query.pipeline.unshift(securityMatch);
    }
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

        // Применяем фильтры безопасности перед конвертацией типов
        applySecurityFilters(query);

        const filter = query.filter ? convertMongoTypes(query.filter) : {};
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
                const pipeline = convertMongoTypes(query.pipeline);
                const hasLimit = pipeline.some((stage: any) => '$limit' in stage);
                if (!hasLimit) {
                    pipeline.push({ $limit: limit });
                }
                queryPromise = collection.aggregate(pipeline).toArray();
                break;

            // CRUD операции
            case 'insertOne':
                if (!query.document) {
                    return { success: false, error: 'Документ обязателен для insertOne' };
                }
                const documentToInsert = convertMongoTypes(query.document);
                // Добавляем timestamps
                documentToInsert.createdAt = new Date();
                documentToInsert.updatedAt = new Date();
                queryPromise = collection.insertOne(documentToInsert);
                break;

            case 'updateOne':
                if (!query.update) {
                    return { success: false, error: 'Обновление обязательно для updateOne' };
                }
                const updateOne = convertMongoTypes(query.update);
                // Добавляем updatedAt
                if (updateOne.$set) {
                    updateOne.$set.updatedAt = new Date();
                } else {
                    updateOne.$set = { updatedAt: new Date() };
                }
                queryPromise = collection.updateOne(filter, updateOne, { upsert: query.upsert });
                break;

            case 'updateMany':
                if (!query.update) {
                    return { success: false, error: 'Обновление обязательно для updateMany' };
                }
                const updateMany = convertMongoTypes(query.update);
                // Добавляем updatedAt
                if (updateMany.$set) {
                    updateMany.$set.updatedAt = new Date();
                } else {
                    updateMany.$set = { updatedAt: new Date() };
                }
                queryPromise = collection.updateMany(filter, updateMany, { upsert: query.upsert });
                break;

            case 'deleteOne':
                if (!filter || Object.keys(filter).length === 0) {
                    return { success: false, error: 'Фильтр обязателен для deleteOne (нельзя удалить без условия)' };
                }
                queryPromise = collection.deleteOne(filter);
                break;

            case 'deleteMany':
                if (!filter || Object.keys(filter).length === 0) {
                    return { success: false, error: 'Фильтр обязателен для deleteMany (нельзя удалить всё)' };
                }
                queryPromise = collection.deleteMany(filter);
                break;

            default:
                return { success: false, error: `Неподдерживаемая операция: ${query.operation}` };
        }

        result = await Promise.race([queryPromise, timeoutPromise]);

        // Для count возвращаем число
        if (query.operation === 'count' || query.operation === 'countDocuments') {
            return { success: true, data: result, count: result };
        }

        // Для CRUD операций форматируем ответ
        if (query.operation === 'insertOne') {
            return {
                success: true,
                data: {
                    insertedId: result.insertedId?.toString(),
                    acknowledged: result.acknowledged
                },
                message: 'Запись успешно создана'
            };
        }

        if (query.operation === 'updateOne' || query.operation === 'updateMany') {
            return {
                success: true,
                data: {
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    upsertedId: result.upsertedId?.toString(),
                    acknowledged: result.acknowledged
                },
                message: result.upsertedId ? 'Запись успешно создана (upsert)' : `Обновлено записей: ${result.modifiedCount}`
            };
        }

        if (query.operation === 'deleteOne' || query.operation === 'deleteMany') {
            return {
                success: true,
                data: {
                    deletedCount: result.deletedCount,
                    acknowledged: result.acknowledged
                },
                message: `Удалено записей: ${result.deletedCount}`
            };
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
