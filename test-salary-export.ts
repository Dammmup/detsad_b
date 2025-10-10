import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Тестовый скрипт для проверки функциональности экспорта зарплат
const testSalaryExport = async () => {
  try {
    console.log('Тестируем экспорт отчета по зарплатам...');
    
    // Замените на реальный URL вашего сервера
    const BASE_URL = 'http://localhost:8080';
    
    // Данные для запроса
    const exportData = {
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      format: 'csv', // или 'pdf', 'excel'
      includeDeductions: true,
      includeBonus: true
    };
    
    // Выполняем POST-запрос к новому маршруту
    const response = await axios.post(
      `${BASE_URL}/reports/salary/export`,
      exportData,
      {
        headers: {
          'Content-Type': 'application/json',
          // Если требуется аутентификация, добавьте токен
          // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
        },
        // Для получения бинарных данных (если это PDF/Excel)
        responseType: 'blob'
      }
    );
    
    console.log('Статус ответа:', response.status);
    console.log('Заголовки ответа:', response.headers);
    console.log('Размер ответа:', response.data.length || response.data.size);
    
    // Сохраняем файл локально для проверки
    const fileName = `salary_report_${exportData.startDate}_${exportData.endDate}.${exportData.format}`;
    const filePath = path.join(__dirname, '..', fileName);
    
    // Записываем файл
    fs.writeFileSync(filePath, response.data);
    
    console.log(`Файл успешно сохранен: ${filePath}`);
    
  } catch (error: any) {
    console.error('Ошибка при тестировании экспорта зарплат:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
      console.error('Заголовки:', error.response.headers);
    } else if (error.request) {
      console.error('Запрос был сделан, но не получен ответ:', error.request);
    } else {
      console.error('Ошибка:', error.message);
    }
  }
};

// Запускаем тест
testSalaryExport();