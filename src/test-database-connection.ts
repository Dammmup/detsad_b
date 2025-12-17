import { connectDatabases, getConnection } from './config/database';
import mongoose from 'mongoose';

async function testDatabaseConnection() {
  try {
    console.log('Начинаем тестирование подключения к базам данных...');


    await connectDatabases();

    console.log('✅ Подключение к базам данных успешно установлено');


    const defaultConnection = getConnection('default');
    const medicalConnection = getConnection('medical');
    const foodConnection = getConnection('food');

    console.log(`Подключение к основной базе данных: ${defaultConnection.readyState === 1 ? 'активно' : 'не активно'}`);
    console.log(`Подключение к базе данных медицинских журналов: ${medicalConnection.readyState === 1 ? 'активно' : 'не активно'}`);
    console.log(`Подключение к базе данных журналов по питанию: ${foodConnection.readyState === 1 ? 'активно' : 'не активно'}`);


    console.log(`Название основной базы данных: ${defaultConnection.name}`);
    console.log(`Название базы данных медицинских журналов: ${medicalConnection.name}`);
    console.log(`Название базы данных журналов по питанию: ${foodConnection.name}`);

    console.log('Тестирование подключения завершено успешно!');


    await mongoose.disconnect();
    console.log('Все подключения закрыты');
  } catch (error) {
    console.error('❌ Ошибка при тестировании подключения:', error);
  }
}


testDatabaseConnection();