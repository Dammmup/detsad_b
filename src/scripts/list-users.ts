import mongoose from 'mongoose';
import User from '../entities/users/model';

async function listUsers() {
  try {
    // Подключение к базе данных
    await mongoose.connect(
      process.env.MONGO_URI || 
      process.env.MONGODB_URI || 
      'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
    
    console.log('🔌 Подключено к базе данных');
    
    // Получить всех пользователей
    const users = await User.find({}).select('phone fullName role');
    
    if (users.length === 0) {
      console.log('❌ Нет пользователей в базе данных');
    } else {
      console.log(`📋 Найдено ${users.length} пользователей:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} | Телефон: ${user.phone} | Роль: ${user.role}`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при получении пользователей:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listUsers();