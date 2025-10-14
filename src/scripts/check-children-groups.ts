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

const checkChildrenGroups = async () => {
  try {
    console.log('Проверяем связи между детьми и группами...');
    
    // Получаем всех детей с populate groupId
    const children = await Child.find({}).populate('groupId');
    
    console.log(`Найдено ${children.length} детей`);
    
    // Проверяем каждого ребенка
    for (const child of children) {
      if (child.groupId) {
        console.log(`Ребенок: ${child.fullName}, Группа: ${(child.groupId as any).name || 'ID: ' + child.groupId}`);
      } else {
        console.log(`Ребенок: ${child.fullName}, Группа: не указана`);
      }
    }
    
    // Получаем все группы
    const groups = await Group.find({});
    console.log(`\nНайдено ${groups.length} групп:`);
    groups.forEach(group => {
      console.log(`- ${group.name} (ID: ${group._id})`);
    });
    
    // Подсчитываем количество детей в каждой группе
    console.log('\nКоличество детей в каждой группе:');
    for (const group of groups) {
      const childrenInGroup = await Child.countDocuments({ groupId: group._id });
      console.log(`- ${group.name}: ${childrenInGroup} детей`);
    }
    
    // Проверяем детей без группы
    const childrenWithoutGroup = await Child.countDocuments({ groupId: { $exists: true, $eq: null } });
    const childrenWithInvalidGroup = await Child.countDocuments({ 
      $and: [
        { groupId: { $exists: true, $ne: null } },
        { groupId: { $nin: groups.map(g => g._id) } }
      ]
    });
    
    console.log(`\nДетей без группы: ${childrenWithoutGroup}`);
    console.log(`Детей с недействительной группой: ${childrenWithInvalidGroup}`);
    
    console.log('\nПроверка завершена!');
  } catch (error) {
    console.error('Ошибка при проверке связей детей и групп:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkChildrenGroups();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();