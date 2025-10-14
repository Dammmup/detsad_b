import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../entities/users/model';

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

// Функция для проверки структуры пользователей
const checkUserStructure = async () => {
  try {
    console.log('Проверяем структуру пользователей...');

    // Получаем одного пользователя
    const user = await User.findOne({}, { 
      salary: 1, 
      shiftRate: 1, 
      salaryType: 1, 
      penaltyType: 1, 
      penaltyAmount: 1, 
      totalFines: 1,
      _id: 0 
    });

    if (user) {
      console.log('Структура пользователя:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('Пользователи не найдены');
    }
  } catch (error) {
    console.error('Ошибка при проверке структуры пользователей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkUserStructure();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();