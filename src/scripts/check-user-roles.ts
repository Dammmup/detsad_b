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

// Функция для проверки ролей пользователей
const checkUserRoles = async () => {
  try {
    console.log('Проверяем роли пользователей...');

    // Получаем всех пользователей с ролями
    const users = await User.find({}, { 
      fullName: 1, 
      role: 1,
      _id: 0 
    }).limit(20);

    console.log(`Найдено ${users.length} пользователей:`);
    
    // Группируем пользователей по ролям
    const roleGroups: { [key: string]: string[] } = {};
    
    for (const user of users) {
      const role = user.role;
      const fullName = user.fullName;
      
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      
      roleGroups[role].push(fullName);
    }
    
    // Выводим пользователей по ролям
    for (const [role, names] of Object.entries(roleGroups)) {
      console.log(`\nРоль "${role}":`);
      for (const name of names) {
        console.log(`  - ${name}`);
      }
    }
    
    // Получаем общее количество пользователей по каждой роли
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('\nОбщее количество пользователей по ролям:');
    for (const group of roleCounts) {
      console.log(`  ${group._id}: ${group.count}`);
    }
  } catch (error) {
    console.error('Ошибка при проверке ролей пользователей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await checkUserRoles();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();