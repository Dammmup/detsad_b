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

// Функция для проверки дат рождения детей
const checkChildrenBirthdayFinal = async () => {
  try {
    console.log('Проверяем даты рождения детей...');

    // Получаем всех детей с датами рождения
    const children = await Child.find({ birthday: { $exists: true, $ne: null } })
                               .limit(10);

    console.log(`Найдено ${children.length} детей с датами рождения:`);
    
    for (const child of children) {
      console.log(`Ребенок: ${child.fullName}, Дата рождения: ${child.birthday ? child.birthday.toISOString().split('T')[0] : 'не указана'}`);
    }
    
    // Получаем детей без дат рождения
    const childrenWithoutBirthday = await Child.find({ birthday: { $exists: false } })
                                             .limit(5);

    console.log(`\nНайдено ${childrenWithoutBirthday.length} детей без дат рождения:`);
    
    for (const child of childrenWithoutBirthday) {
      console.log(`Ребенок: ${child.fullName}, Дата рождения: не указана`);
    }
  } catch (error) {
    console.error('Ошибка при проверке дат рождения детей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkChildrenBirthdayFinal();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();