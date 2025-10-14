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

// Функция для проверки дат рождения пользователей
const checkUsersBirthdayFinal5 = async () => {
  try {
    console.log('Проверяем даты рождения пользователей...');

    // Получаем всех пользователей с датами рождения
    const users = await User.find({ birthday: { $exists: true, $ne: null } })
                           .limit(10);

    console.log(`Найдено ${users.length} пользователей с датами рождения:`);
    
    for (const user of users) {
      console.log(`Пользователь: ${user.fullName}, Дата рождения: ${user.birthday ? user.birthday.toISOString().split('T')[0] : 'не указана'}`);
    }
    
    // Получаем пользователей без дат рождения
    const usersWithoutBirthday = await User.find({ birthday: { $exists: false } })
                                         .limit(5);

    console.log(`\nНайдено ${usersWithoutBirthday.length} пользователей без дат рождения:`);
    
    for (const user of usersWithoutBirthday) {
      console.log(`Пользователь: ${user.fullName}, Дата рождения: не указана`);
    }
  } catch (error) {
    console.error('Ошибка при проверке дат рождения пользователей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkUsersBirthdayFinal5();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();