import mongoose from 'mongoose';
import Child from '../entities/children/model';

async function updateAllChildrenStatus() {
  try {
    // Подключение к базе данных
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
    
    console.log('🔌 Подключено к базе данных');
    
    // Обновить поле active для всех детей
    const result = await Child.updateMany(
      {}, // Фильтр - все документы
      { $set: { active: true } } // Установить active в true
    );
    
    console.log(`✅ Обновлено ${result.modifiedCount} записей детей`);
    console.log(`📋 Всего детей в базе: ${result.matchedCount}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при обновлении статуса детей:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updateAllChildrenStatus();