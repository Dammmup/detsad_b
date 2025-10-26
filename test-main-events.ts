import mongoose from 'mongoose';
import { MainEventsService } from './src/entities/mainEvents/service';
import { initializeTaskScheduler } from './src/services/taskScheduler';

// Подключение к MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/kindergarten';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключились к MongoDB для тестирования');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
}

// Тестирование функционала
async function testMainEvents() {
  await connectDB();
  
  try {
    console.log('🧪 Запуск тестирования функционала mainEvents...');
    
    // Инициализируем планировщик
    initializeTaskScheduler();
    
    // Создаем экземпляр сервиса
    const mainEventsService = new MainEventsService();
    
    // Проверяем наличие событий
    const events = await mainEventsService.getAll({ enabled: true });
    console.log('📋 Найдено активных событий:', events.length);
    
    if (events.length > 0) {
      console.log('📋 Активные события:');
      events.forEach(event => {
        console.log(`  - ${event.name} (день: ${event.dayOfMonth})`);
      });
    } else {
      console.log('📭 Нет активных событий для тестирования');
    }
    
    console.log('✅ Тестирование завершено');
    
  } catch (error) {
    console.error('❌ Ошибка во время тестирования:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Соединение с БД закрыто');
  }
}

// Запуск теста
if (require.main === module) {
  testMainEvents().catch(console.error);
}

export { testMainEvents };