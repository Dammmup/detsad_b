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

const mergeDuplicateGroups = async () => {
 try {
    console.log('Начинаем объединение дублирующихся групп...');
    
    // Находим дублирующиеся группы (с одинаковыми названиями, но разным регистром)
    const allGroups = await Group.find({});
    
    // Группируем группы по названию в нижнем регистре
    const groupedGroups = new Map<string, any[]>();
    for (const group of allGroups) {
      const lowerName = group.name.toLowerCase();
      if (!groupedGroups.has(lowerName)) {
        groupedGroups.set(lowerName, []);
      }
      groupedGroups.get(lowerName)!.push(group);
    }
    
    // Обрабатываем только те группы, у которых есть дубликаты
    for (const [lowerName, groups] of groupedGroups) {
      if (groups.length > 1) {
        console.log(`\nНайдены дубликаты для группы "${lowerName}":`);
        groups.forEach(g => console.log(` - ${g.name} (ID: ${g._id}, детей: ${g.childrenCount || 0})`));
        
        // Находим группу с наибольшим количеством детей (или последнюю созданную)
        let mainGroup = groups[0];
        for (const group of groups) {
          const childCount = await Child.countDocuments({ groupId: group._id });
          const mainGroupChildCount = await Child.countDocuments({ groupId: mainGroup._id });
          
          if (childCount > mainGroupChildCount) {
            mainGroup = group;
          }
        }
        
        console.log(`  Основная группа: ${mainGroup.name} (ID: ${mainGroup._id})`);
        
        // Переносим детей из других групп в основную
        for (const group of groups) {
          if (group._id.toString() !== mainGroup._id.toString()) {
            console.log(`  Переносим детей из ${group.name} в ${mainGroup.name}`);
            
            // Обновляем groupId у детей
            await Child.updateMany(
              { groupId: group._id },
              { $set: { groupId: mainGroup._id } }
            );
            
            // Удаляем дублирующую группу
            await Group.findByIdAndDelete(group._id);
            console.log(`  Удалена группа: ${group.name}`);
          }
        }
        
        // Обновляем название основной группы к стандартному формату (все заглавные)
        await Group.findByIdAndUpdate(mainGroup._id, { 
          $set: { 
            name: mainGroup.name.toUpperCase() 
          } 
        });
        console.log(`  Обновлено название основной группы на: ${mainGroup.name.toUpperCase()}`);
      }
    }
    
    // Выводим финальное состояние
    const finalGroups = await Group.find({});
    console.log(`\nФинальное состояние: ${finalGroups.length} групп:`);
    for (const group of finalGroups) {
      const childCount = await Child.countDocuments({ groupId: group._id });
      console.log(`  - ${group.name}: ${childCount} детей (ID: ${group._id})`);
    }
    
    console.log('\nОбъединение дублирующихся групп завершено!');
  } catch (error) {
    console.error('Ошибка при объединении дублирующихся групп:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await mergeDuplicateGroups();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();