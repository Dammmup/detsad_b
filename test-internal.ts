import { exportSalaryReport } from './src/entities/reports/controller';
import { Request, Response } from 'express';

// Создаем mock объекты для Request и Response для тестирования контроллера напрямую
const createMockRequest = (body: any = {}, user: any = { id: 'test_user_id', role: 'admin' }) => {
  return {
    body,
    user,
    query: {},
    params: {},
    headers: {},
    originalUrl: '/reports/salary/export'
  } as unknown as Request;
};

const createMockResponse = () => {
  const res: Partial<Response> = {};
  let statusCode = 200;
  let responseHeaders: { [key: string]: string } = {};
  let responseData: any;

  res.status = function(code: number) {
    statusCode = code;
    console.log(`Response status set to: ${code}`);
    return res as Response;
  };
  res.json = function(data: any) {
    console.log('Response JSON:', JSON.stringify(data, null, 2));
    responseData = data;
    return res as Response;
  };
  res.setHeader = function(name: string, value: string) {
    responseHeaders[name] = value;
    console.log(`Header set: ${name} = ${value}`);
    return res as Response;
  };
  res.send = function(data: any) {
    console.log('Response sent with data type:', typeof data);
    if (typeof data === 'object' && data !== null) {
      console.log('Data length:', data.length || data.size || (data instanceof Buffer ? data.length : JSON.stringify(data).length));
    }
    responseData = data;
    return res as Response;
  };
  res.get = function(name: string) {
    return responseHeaders[name];
  };

  return res as Response;
};

// Тестирование контроллера экспорта зарплат напрямую
const testInternalController = async () => {
  console.log('Тестируем контроллер экспорта зарплат напрямую (внутренний тест)...');
  
  try {
    // Подготовим тестовые данные
    const mockReq = createMockRequest({
      startDate: '2025-01',
      endDate: '2025-01-31',
      format: 'csv',
      includeDeductions: true,
      includeBonus: true
    }, { id: 'test_user_id', role: 'admin' });
    
    const mockRes = createMockResponse();
    
    // Вызываем контроллер напрямую
    await exportSalaryReport(mockReq, mockRes);
    
    console.log('Контроллер успешно выполнен без ошибок');
    
  } catch (error) {
    console.error('Ошибка при тестировании контроллера:', error);
 }
};

// Запускаем тест
testInternalController();