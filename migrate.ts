import mongoose from 'mongoose';
import { up as convertChildPaymentPeriodsUp } from './migrations/convert-child-payment-periods-direct';
import * as dotenv from 'dotenv';
dotenv.config();

async function runMigrations() {
  try {
    // Подключаемся к базе данных
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      bufferCommands: false,
    });
    console.log('Подключено к MongoDB');

    // Выполняем миграции
    console.log('Запускаем миграции...');
    await convertChildPaymentPeriodsUp();
    console.log('Миграции завершены');
  } catch (error) {
    console.error('Ошибка при выполнении миграций:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.connection.close();
    console.log('Соединение с MongoDB закрыто');
  }
}

// Запускаем миграции
runMigrations();