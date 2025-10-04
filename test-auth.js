const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testAuth() {
  try {
    console.log('🔍 Тестирование аутентификации...');
    
    // Тест 1: Попытка доступа к защищенному эндпоинту без токена
    console.log('\n1. Тест без токена:');
    try {
      await axios.get(`${BASE_URL}/reports/salary`);
      console.log('❌ Ошибка: запрос прошел без токена');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Правильно: получена 401 ошибка');
      } else {
        console.log('❌ Неожиданная ошибка:', error.response?.status, error.response?.data);
      }
    }
    
    // Тест 2: Попытка входа с неверными данными
    console.log('\n2. Тест входа с неверными данными:');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        phone: 'invalid',
        password: 'invalid'
      });
      console.log('❌ Ошибка: вход прошел с неверными данными');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.log('✅ Правильно: получена ошибка аутентификации');
      } else {
        console.log('❌ Неожиданная ошибка:', error.response?.status, error.response?.data);
      }
    }
    
    // Тест 3: Проверка доступности эндпоинтов
    console.log('\n3. Проверка доступности эндпоинтов:');
    const endpoints = [
      '/reports/salary',
      '/child-attendance',
      '/task-list',
      '/staff-shifts'
    ];
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`❌ ${endpoint}: доступен без аутентификации`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ ${endpoint}: правильно защищен (401)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint}: не найден (404)`);
        } else {
          console.log(`❓ ${endpoint}: статус ${error.response?.status}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testAuth();
