import mongoose from 'mongoose';
import { connectDatabases } from './src/config/database';
import * as dotenv from 'dotenv';
import { up as removeShiftStatusAndFieldsUp } from './migrations/remove-shift-status-and-fields';

dotenv.config();

async function runRemoveFieldsMigration() {
  try {

    await connectDatabases();
    console.log('Подключено к MongoDB');


    console.log('Запускаем миграцию по удалению полей...');
    await removeShiftStatusAndFieldsUp();
    console.log('Миграция по удалению полей завершена');
  } catch (error) {
    console.error('Ошибка при выполнении миграции по удалению полей:', error);
  } finally {

    await mongoose.connection.close();
    console.log('Соединение с MongoDB закрыто');
  }
}


runRemoveFieldsMigration();