import { exportSalaryReport } from './src/entities/reports/controller';
import { Request, Response } from 'express';

// Создаем mock объекты для Request и Response
const createMockRequest = (body: any = {}, user: any = { id: 'test_user_id', role: 'admin' }) => {
  return {
    body,
    user,
    query: {},
    params: {},
    headers: {}
  } as unknown as Request;
};

// Простая реализация mock Response без использования Jest
const createMockResponse = () => {
 const res: Partial<Response> = {};
  res.status = function(code: number) {
    console.log(`Response status set to: ${code}`);
    return res as Response;
  };
  res.json = function(data: any) {
    console.log('Response JSON:', data);
    return res as Response;
  };
  res.setHeader = function(name: string, value: string) {
    console.log(`Header set: ${name} = ${value}`);
    return res as Response;
  };
  res.send = function(data: any) {
    console.log('Response sent with data type:', typeof data);
    if (typeof data === 'object' && data !== null) {
      console.log('Data length:', data.length || data.size || Object.keys(data).length);
    }
    return res as Response;
  };
  return res as Response;
};

// Тестирование контроллера экспорта зарплат
const testController = async () => {
  console.log('Тестируем контроллер экспорта зарплат напрямую...');
  
  try {
    // Подготовим тестовые данные
    const mockReq = createMockRequest({
      startDate: '2025-01',
      endDate: '2025-01-31',
      format: 'csv',
      includeDeductions: true,
      includeBonus: true
    });
    
    const mockRes = createMockResponse();
    
    // Вызываем контроллер
    await exportSalaryReport(mockReq, mockRes);
    
    console.log('Контроллер успешно выполнен');
    
  } catch (error) {
    console.error('Ошибка при тестировании контроллера:', error);
  }
};

// Запускаем тест
testController();