import mongoose, { Connection, Model, Schema } from 'mongoose';

// Интерфейсы для типизации подключений
export interface IDatabaseConnections {
  default: Connection;
  medical: Connection;
  food: Connection;
}

// Объект для хранения подключений
let connections: IDatabaseConnections | null = null;

const DATABASE_URIS = {
  default: process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0',
  medical: process.env.MEDICAL_MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/medician_journals?retryWrites=true&w=majority&appName=Cluster0',
  food: process.env.FOOD_MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/food_journals?retryWrites=true&w=majority&appName=Cluster0',
};


/**
 * Подключение ко всем базам данных
 */
export const connectDatabases = async (): Promise<IDatabaseConnections> => {
  if (connections) {
    return connections;
  }

  try {
    // Подключение к основной базе данных (default)
    const defaultConnection = await mongoose.createConnection(DATABASE_URIS.default).asPromise();
    console.log('✅ Подключено к основной базе данных (test)');

    // Подключение к базе данных медицинских журналов
    const medicalConnection = await mongoose.createConnection(DATABASE_URIS.medical).asPromise();
    console.log('✅ Подключено к базе данных медицинских журналов (medician_journals)');

    // Подключение к базе данных журналов по питанию
    const foodConnection = await mongoose.createConnection(DATABASE_URIS.food).asPromise();
    console.log('✅ Подключено к базе данных журналов по питанию (food_journals)');

    connections = {
      default: defaultConnection,
      medical: medicalConnection,
      food: foodConnection,
    };

    return connections;
  } catch (error) {
    console.error('❌ Ошибка подключения к базам данных:', error);
    throw error;
  }
};

/**
 * Получение подключения к конкретной базе данных
 */
export const getConnection = (database: keyof IDatabaseConnections): Connection => {
  if (!connections) {
    throw new Error('Базы данных не подключены. Вызовите connectDatabases() сначала.');
  }
  return connections[database];
};

// Кеш для моделей - избегаем повторного создания
const modelCache = new Map<string, Model<any>>();

/**
 * Функция для создания фабрики модели с отложенным подключением
 * Это позволяет создавать модели до подключения к базе данных
 * Модель кешируется после первого создания
 */
export const createModelFactory = <T>(
  modelName: string,
  schema: Schema,
  collectionName: string,
  database: keyof IDatabaseConnections
): (() => Model<T>) => {
  const cacheKey = `${database}:${modelName}`;

  return () => {
    // Проверяем кеш
    if (modelCache.has(cacheKey)) {
      return modelCache.get(cacheKey) as Model<T>;
    }

    const connection = getConnection(database);

    // Проверяем, есть ли уже модель в connection
    try {
      const existingModel = connection.model<T>(modelName);
      modelCache.set(cacheKey, existingModel);
      return existingModel;
    } catch {
      // Модель не существует, создаём новую
      const newModel = connection.model<T>(modelName, schema, collectionName);
      modelCache.set(cacheKey, newModel);
      return newModel;
    }
  };
};