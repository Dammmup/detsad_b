import mongoose from 'mongoose';
import { up as convertChildPaymentPeriodsUp } from './migrations/convert-child-payment-periods-direct';
import { up as updateShiftStatusesUp } from './migrations/update-shift-statuses';
import { connectDatabases } from './src/config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function runMigrations() {
  try {
    // Подключаемся к базе данных
    await connectDatabases();
    console.log('Подключено к MongoDB');

    // Выполняем миграции
    console.log('Запускаем миграции...');
    await convertChildPaymentPeriodsUp();
    await updateShiftStatusesUp();
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