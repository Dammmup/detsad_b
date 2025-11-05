import mongoose from 'mongoose';
import { connectDatabases } from './src/config/database';
import * as dotenv from 'dotenv';
import { up as updateShiftStatusesUp } from './migrations/update-shift-statuses';

dotenv.config();

async function runShiftStatusMigration() {
  try {
    // Подключаемся к базе данных
    await connectDatabases();
    console.log('Подключено к MongoDB');

    // Выполняем только миграцию статусов смен
    console.log('Запускаем миграцию статусов смен...');
    await updateShiftStatusesUp();
    console.log('Миграция статусов смен завершена');
  } catch (error) {
    console.error('Ошибка при выполнении миграции статусов смен:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.connection.close();
    console.log('Соединение с MongoDB закрыто');
  }
}

// Запускаем миграцию статусов смен
runShiftStatusMigration();