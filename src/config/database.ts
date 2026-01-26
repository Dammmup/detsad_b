import mongoose from 'mongoose';
import { MONGODB_URI } from './mongo';

let isConnected = false;

/**
 * Подключение к MongoDB через Mongoose
 * Использует тот же URI что и нативный клиент для согласованности
 */
export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('⚡ Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 секунд на выбор сервера
      socketTimeoutMS: 45000,          // 45 секунд таймаут сокета
      maxPoolSize: 10,                 // максимальный размер пула соединений
      minPoolSize: 2,                  // минимальный размер пула соединений
      maxIdleTimeMS: 30000,            // время жизни неактивного соединения
      bufferCommands: false,           // отключить буферизацию команд
      // bufferMaxEntries опция больше не поддерживается в новых версиях Mongoose
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB via Mongoose');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Get Mongoose connection ensuring it's established
 */
export const getMongooseConnection = async () => {
  if (!isConnected) {
    await connectDB();
  }
  return mongoose.connection;
};

/**
 * Закрытие соединения с базой данных
 */
export const disconnectDB = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 Disconnected from MongoDB');
  }
};

/**
 * Алиас для совместимости с миграциями
 */
export const connectDatabases = connectDB;

export default connectDB;
