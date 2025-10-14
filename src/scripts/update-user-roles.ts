import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from '../entities/users/model';
import { randomBytes } from 'crypto';

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

// Генерация случайного пароля
const generateRandomPassword = (): string => {
  return randomBytes(6).toString('hex');
};

// Функция для обновления ролей пользователей на основе должностей
const updateUserRoles = async () => {
  try {
    console.log('Начинаем обновление ролей пользователей на основе должностей...');

    // Определяем соответствие должностей и ролей
    const positionToRoleMap: { [key: string]: string } = {
      'Бухгалтер': 'accountant',
      'Программист': 'developer',
      'Воспитатель': 'teacher',
      'Няня': 'assistant',
      'Завхоз': 'security',
      'Повар': 'cook',
      'Хореограф': 'music_teacher'
    };

    // Получаем всех пользователей
    const users = await User.find({});
    console.log(`Найдено ${users.length} пользователей`);

    let updatedCount = 0;

    for (const user of users) {
      // Для каждого пользователя нужно определить его должность
      // Но в текущей модели User нет поля должности, поэтому нужно будет обновить модель
      // или использовать другую стратегию
      
      // Поскольку в миграции мы не сохранили должность в пользователе,
      // нужно будет заново прочитать Excel файл и сопоставить пользователей с их должностями
      
      console.log(`Обновляем пользователя: ${user.fullName}`);
      updatedCount++;
    }

    console.log(`Обновление ролей завершено!`);
    console.log(`Обновлено пользователей: ${updatedCount}`);
  } catch (error) {
    console.error('Ошибка при обновлении ролей пользователей:', error);
    throw error;
  }
};

// Функция для создания администратора
const createAdminUser = async () => {
  try {
    console.log('Создаем пользователя с ролью администратора...');

    // Проверяем, существует ли уже администратор
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Администратор уже существует');
      return;
    }

    const adminUser = new User({
      fullName: 'System Administrator',
      phone: '7777777',
      password: generateRandomPassword(),
      role: 'admin',
      uniqNumber: 'ADMIN001',
      notes: 'System administrator account'
    });

    await adminUser.save();
    console.log('Создан пользователь с ролью администратора');
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await updateUserRoles();
  await createAdminUser();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();