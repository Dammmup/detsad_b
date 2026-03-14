import mongoose from 'mongoose';
import { MONGODB_URI } from './mongo';

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Подключение к MongoDB через Mongoose
 * Использует тот же URI что и нативный клиент для согласованности
 */
export const connectDB = async (): Promise<void> => {
  if (cached.conn) {
    console.log('⚡ Using existing database connection');
    return;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
    };

    console.log('🔄 Creating new Mongoose connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB via Mongoose');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }
};

/**
 * Get Mongoose connection ensuring it's established
 */
export const getMongooseConnection = async () => {
  if (!cached.conn) {
    await connectDB();
  }
  return mongoose.connection;
};

/**
 * Закрытие соединения с базой данных
 */
export const disconnectDB = async (): Promise<void> => {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 Disconnected from MongoDB');
  }
};

/**
 * Алиас для совместимости с миграциями
 */
export const connectDatabases = connectDB;

export default connectDB;
