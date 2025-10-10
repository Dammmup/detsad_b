import express from 'express';
import reportsRoutes from './src/entities/reports/route';

// Создаем тестовое приложение для отладки маршрутов
const testApp = express();
testApp.use(express.json());
testApp.use(express.urlencoded({ extended: true }));

// Подключаем маршрут reports как в основном приложении
testApp.use('/reports', reportsRoutes);

// Добавляем обработчик 404 для отладки
testApp.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Запускаем тестовый сервер на другом порту
const PORT = 9090;
testApp.listen(PORT, () => {
  console.log(`Тестовый сервер маршрутов запущен на порту ${PORT}`);
  console.log('Доступные маршруты:');
  console.log('- GET  /reports');
  console.log('- POST /reports/salary/export');
  console.log('- Другие маршруты из reportsRoutes...');
  
  // Проверим, можем ли мы выполнить запрос к нашему маршруту
  console.log('\nДля тестирования используйте:');
  console.log(`curl -X POST http://localhost:${PORT}/reports/salary/export -H "Content-Type: application/json" -d '{"startDate":"2025-01","endDate":"2025-01-31","format":"csv"}'`);
});