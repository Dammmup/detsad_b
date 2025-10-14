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

// Функция для проверки номеров телефонов пользователей
const checkUsersPhoneFinal5 = async () => {
  try {
    console.log('Проверяем номера телефонов пользователей...');

    // Получаем всех пользователей с номерами телефонов
    const users = await User.find({ phone: { $exists: true, $ne: null } })
                           .limit(10);

    console.log(`Найдено ${users.length} пользователей с номерами телефонов:`);
    
    for (const user of users) {
      console.log(`Пользователь: ${user.fullName}, Номер телефона: ${user.phone}`);
    }
    
    // Получаем пользователей без номеров телефонов
    const usersWithoutPhone = await User.find({ phone: { $exists: false } })
                                      .limit(5);

    console.log(`\nНайдено ${usersWithoutPhone.length} пользователей без номеров телефонов:`);
    
    for (const user of usersWithoutPhone) {
      console.log(`Пользователь: ${user.fullName}, Номер телефона: не указан`);
    }
  } catch (error) {
    console.error('Ошибка при проверке номеров телефонов пользователей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkUsersPhoneFinal5();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();