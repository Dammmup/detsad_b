import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../entities/users/model';
import Child from '../entities/children/model';

// Загружаем переменные окружения
dotenv.config();

// Подключение к базе данных
const connectDB = async () => {
  try {
    // Используем MONGO_URI из .env файла
    const dbUri = process.env.MONGO_URI;
    if (!dbUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Функция для очистки коллекций
const clearCollections = async () => {
  try {
    console.log('Начинаем очистку коллекций...');

    // Удаляем все записи из коллекции пользователей
    const usersDeleted = await User.deleteMany({});
    console.log(`Удалено пользователей: ${usersDeleted.deletedCount}`);

    // Удаляем все записи из коллекции детей
    const childrenDeleted = await Child.deleteMany({});
    console.log(`Удалено детей: ${childrenDeleted.deletedCount}`);

    console.log('Очистка коллекций завершена!');
  } catch (error) {
    console.error('Ошибка при очистке коллекций:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await clearCollections();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();