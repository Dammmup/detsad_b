import mongoose from 'mongoose';
import User from '../entities/users/model';
import { hashPassword } from '../utils/hash';

async function resetAdminPassword() {
  try {
    // Подключение к базе данных
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
    
    console.log('🔌 Подключено к базе данных');
    
    // Найти администратора с телефоном 77777
    const adminUser = await User.findOne({ phone: '777777' });
    
    if (!adminUser) {
      console.log('❌ Администратор с телефоном 77777 не найден');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    // Установить новый пароль
    const newPlainPassword = 'admin123'; // Вы можете изменить на любой другой пароль
    const newPasswordHash = await hashPassword(newPlainPassword);
    
    // Обновить пользователя, обходя валидацию для поля password
    await User.findOneAndUpdate(
      { _id: adminUser._id },
      {
        passwordHash: newPasswordHash,
        initialPassword: newPlainPassword,
        password: newPasswordHash // Устанавливаем хешированный пароль в поле password
      },
      { runValidators: false }
    );
    
    console.log('✅ Пароль администратора успешно сброшен');
    console.log('📞 Телефон:', adminUser.phone);
    console.log('🔑 Новый пароль:', newPlainPassword);
    console.log('👤 Имя:', adminUser.fullName);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при сбросе пароля:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetAdminPassword();