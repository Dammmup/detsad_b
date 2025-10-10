import axios from 'axios';

// Тестовый скрипт для проверки функциональности экспорта зарплат через запущенный сервер с аутентификацией
const testSalaryExportRequestWithAuth = async () => {
  try {
    console.log('Тестируем экспорт отчета по зарплатам через запущенный сервер (с аутентификацией)...');
    
    // Замените на реальный URL вашего сервера
    const BASE_URL = 'http://localhost:8080';
    
    // Попробуем сначала получить токен аутентификации, если он нужен
    // Но для тестирования можно попробовать вызвать маршрут напрямую
    const exportData = {
      startDate: '2025-01',
      endDate: '2025-01-31',
      format: 'csv', // или 'pdf', 'excel'
      includeDeductions: true,
      includeBonus: true
    };
    
    // Выполняем POST-запрос к новому маршруту
    // Для тестирования без аутентификации, сначала проверим, можем ли мы получить 401 ошибку
    const response = await axios.post(
      `${BASE_URL}/reports/salary/export`,
      exportData,
      {
        headers: {
          'Content-Type': 'application/json',
          // В реальном сценарии здесь может потребоваться токен аутентификации
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
        },
        // Для получения бинарных данных (если это PDF/Excel)
        responseType: 'blob'
      }
    );
    
    console.log('Статус ответа:', response.status);
    console.log('Заголовки ответа:', response.headers);
    console.log('Размер ответа:', response.data.length || response.data.size);
    
    // Выводим первые 100 символов ответа для проверки
    const responseData = Buffer.isBuffer(response.data) 
      ? response.data.subarray(0, 100).toString() 
      : typeof response.data === 'string' 
        ? response.data.substring(0, 100) 
        : JSON.stringify(response.data).substring(0, 100);
    
    console.log('Первые 100 символов ответа:', responseData);
    
  } catch (error: any) {
    console.error('Ошибка при тестировании экспорта зарплат:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      // Проверим, является ли ошибка связанной с аутентификацией
      if (error.response.status === 401) {
        console.log('Требуется аутентификация');
      } else if (error.response.status === 403) {
        console.log('Недостаточно прав доступа');
      }
      console.error('Данные:', error.response.data.toString ? error.response.data.toString() : error.response.data);
      console.error('Заголовки:', error.response.headers);
    } else if (error.request) {
      console.error('Запрос был сделан, но не получен ответ:', error.request);
    } else {
      console.error('Ошибка:', error.message);
    }
  }
};

// Запускаем тест
testSalaryExportRequestWithAuth();