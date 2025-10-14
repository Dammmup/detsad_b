import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Child from '../entities/children/model';
import Group from '../entities/groups/model';

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

// Функция для проверки групп детей
const checkChildrenGroupsFinal6 = async () => {
  try {
    console.log('Проверяем группы детей...');

    // Получаем всех детей с группами
    const children = await Child.find({ groupId: { $exists: true, $ne: null } })
                                .populate('groupId')
                                .limit(10);

    console.log(`Найдено ${children.length} детей с группами:`);
    
    for (const child of children) {
      console.log(`Ребенок: ${child.fullName}, Группа: ${(child.groupId as any)?.name || 'не указана'}`);
    }
    
    // Получаем детей без групп
    const childrenWithoutGroup = await Child.find({ groupId: { $exists: false } })
                                           .limit(5);

    console.log(`\nНайдено ${childrenWithoutGroup.length} детей без групп:`);
    
    for (const child of childrenWithoutGroup) {
      console.log(`Ребенок: ${child.fullName}, Группа: не указана`);
    }
    
    // Получаем все группы
    const groups = await Group.find({});
    console.log(`\nВсего групп: ${groups.length}`);
    
    for (const group of groups) {
      console.log(`Группа: ${group.name}, Активна: ${group.isActive}`);
    }
  } catch (error) {
    console.error('Ошибка при проверке групп детей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkChildrenGroupsFinal6();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();