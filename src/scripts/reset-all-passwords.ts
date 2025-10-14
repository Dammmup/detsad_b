import mongoose from 'mongoose';
import User from '../entities/users/model';
import { hashPassword } from '../utils/hash';

async function resetAllPasswords() {
  try {
    // Подключение к базе данных
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
    
    console.log('🔌 Подключено к базе данных');
    
    // Получить всех пользователей
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('❌ Нет пользователей в базе данных');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log(`📋 Найдено ${users.length} пользователей. Обновляем пароли...`);
    
    // Установить стандартный пароль для всех пользователей
    const defaultPassword = 'password123'; // Вы можете изменить на любой другой пароль
    const defaultPasswordHash = await hashPassword(defaultPassword);
    
    for (const user of users) {
      await User.findByIdAndUpdate(
        user._id,
        { 
          passwordHash: defaultPasswordHash,
          initialPassword: defaultPassword,
          password: defaultPasswordHash // Устанавливаем хешированный пароль в поле password
        },
        { runValidators: false }
      );
      
      console.log(`✅ Обновлен пароль для: ${user.fullName} (телефон: ${user.phone})`);
    }
    
    console.log('\n🎉 Все пароли успешно сброшены!');
    console.log(`🔑 Стандартный пароль для всех пользователей: ${defaultPassword}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при сбросе паролей:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetAllPasswords();