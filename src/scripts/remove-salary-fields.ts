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

// Функция для удаления полей, связанных с зарплатой, из пользователей
const removeSalaryFields = async () => {
  try {
    console.log('Начинаем удаление полей, связанных с зарплатой, из пользователей...');

    // Найдем все записи пользователей
    const users = await User.find({});

    console.log(`Найдено ${users.length} пользователей`);

    let updatedCount = 0;

    for (const user of users) {
      let updated = false;
      
    
      if (updated) {

        // Сохраняем обновленного пользователя
        await User.findByIdAndUpdate(user._id, { $unset: { 
          salary: 1, 
          shiftRate: 1, 
          salaryType: 1, 
          penaltyType: 1, 
          penaltyAmount: 1 
        }});
        
        console.log(`Обновлен пользователь: ${user.fullName}`);
        updatedCount++;
      }
    }

    console.log(`Обновлено ${updatedCount} пользователей`);
  } catch (error) {
    console.error('Ошибка при удалении полей из пользователей:', error);
    throw error;
  }
};

// Запуск скрипта
const runScript = async () => {
  await connectDB();
  await removeSalaryFields();
  mongoose.connection.close();
  console.log('Соединение с базой данных закрыто');
};

runScript();