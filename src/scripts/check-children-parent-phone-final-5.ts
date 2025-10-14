import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
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

// Функция для проверки номеров телефонов родителей у детей
const checkChildrenParentPhoneFinal5 = async () => {
  try {
    console.log('Проверяем номера телефонов родителей у детей...');

    // Получаем всех детей с номерами телефонов родителей
    const children = await Child.find({ parentPhone: { $exists: true, $ne: null } })
                                .limit(10);

    console.log(`Найдено ${children.length} детей с номерами телефонов родителей:`);
    
    for (const child of children) {
      console.log(`Ребенок: ${child.fullName}, Номер телефона родителя: ${child.parentPhone}`);
    }
    
    // Получаем детей без номеров телефонов родителей
    const childrenWithoutPhone = await Child.find({ parentPhone: { $exists: false } })
                                           .limit(5);

    console.log(`\nНайдено ${childrenWithoutPhone.length} детей без номеров телефонов родителей:`);
    
    for (const child of childrenWithoutPhone) {
      console.log(`Ребенок: ${child.fullName}, Номер телефона родителя: не указан`);
    }
  } catch (error) {
    console.error('Ошибка при проверке номеров телефонов родителей у детей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkChildrenParentPhoneFinal5();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();