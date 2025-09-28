// Скрипт для проверки API endpoints без использования supertest
import axios from 'axios';

// Конфигурация
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_TIMEOUT = 5000; // 5 секунд

interface EndpointTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  message?: string;
}

class ApiEndpointTester {
  private results: EndpointTestResult[] = [];

  // Добавление результата теста
  private addResult(endpoint: string, method: string, result: Omit<EndpointTestResult, 'endpoint' | 'method'>) {
    this.results.push({ endpoint, method, ...result });
  }

  // Тест GET endpoint
  private async testGetEndpoint(endpoint: string, description: string) {
    console.log(`\nТестирование GET ${endpoint} (${description})...`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        timeout: TEST_TIMEOUT
      });
      
      this.addResult(endpoint, 'GET', {
        status: 'success',
        statusCode: response.status,
        message: `Успешно: ${response.status}`
      });
      
      console.log(`  ✓ Успешно: ${response.status}`);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        this.addResult(endpoint, 'GET', {
          status: 'timeout',
          message: 'Таймаут'
        });
        console.log(`  ✗ Таймаут`);
      } else if (error.response) {
        // Сервер ответил с кодом ошибки
        this.addResult(endpoint, 'GET', {
          status: 'error',
          statusCode: error.response.status,
          message: `Ошибка: ${error.response.status} - ${error.response.statusText}`
        });
        console.log(`  ✗ Ошибка: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Запрос был сделан, но ответа не было
        this.addResult(endpoint, 'GET', {
          status: 'error',
          message: 'Нет ответа от сервера'
        });
        console.log(`  ✗ Нет ответа от сервера`);
      } else {
        // Что-то произошло при настройке запроса
        this.addResult(endpoint, 'GET', {
          status: 'error',
          message: `Ошибка: ${error.message}`
        });
        console.log(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  // Тест POST endpoint
  private async testPostEndpoint(endpoint: string, data: any, description: string) {
    console.log(`\nТестирование POST ${endpoint} (${description})...`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.addResult(endpoint, 'POST', {
        status: 'success',
        statusCode: response.status,
        message: `Успешно: ${response.status}`
      });
      
      console.log(`  ✓ Успешно: ${response.status}`);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        this.addResult(endpoint, 'POST', {
          status: 'timeout',
          message: 'Таймаут'
        });
        console.log(`  ✗ Таймаут`);
      } else if (error.response) {
        // Сервер ответил с кодом ошибки
        this.addResult(endpoint, 'POST', {
          status: 'error',
          statusCode: error.response.status,
          message: `Ошибка: ${error.response.status} - ${error.response.statusText}`
        });
        console.log(`  ✗ Ошибка: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Запрос был сделан, но ответа не было
        this.addResult(endpoint, 'POST', {
          status: 'error',
          message: 'Нет ответа от сервера'
        });
        console.log(`  ✗ Нет ответа от сервера`);
      } else {
        // Что-то произошло при настройке запроса
        this.addResult(endpoint, 'POST', {
          status: 'error',
          message: `Ошибка: ${error.message}`
        });
        console.log(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  // Тест PUT endpoint
  private async testPutEndpoint(endpoint: string, data: any, description: string) {
    console.log(`\nТестирование PUT ${endpoint} (${description})...`);
    
    try {
      const response = await axios.put(`${API_BASE_URL}${endpoint}`, data, {
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.addResult(endpoint, 'PUT', {
        status: 'success',
        statusCode: response.status,
        message: `Успешно: ${response.status}`
      });
      
      console.log(`  ✓ Успешно: ${response.status}`);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        this.addResult(endpoint, 'PUT', {
          status: 'timeout',
          message: 'Таймаут'
        });
        console.log(`  ✗ Таймаут`);
      } else if (error.response) {
        // Сервер ответил с кодом ошибки
        this.addResult(endpoint, 'PUT', {
          status: 'error',
          statusCode: error.response.status,
          message: `Ошибка: ${error.response.status} - ${error.response.statusText}`
        });
        console.log(`  ✗ Ошибка: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Запрос был сделан, но ответа не было
        this.addResult(endpoint, 'PUT', {
          status: 'error',
          message: 'Нет ответа от сервера'
        });
        console.log(`  ✗ Нет ответа от сервера`);
      } else {
        // Что-то произошло при настройке запроса
        this.addResult(endpoint, 'PUT', {
          status: 'error',
          message: `Ошибка: ${error.message}`
        });
        console.log(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  // Тест DELETE endpoint
  private async testDeleteEndpoint(endpoint: string, description: string) {
    console.log(`\nТестирование DELETE ${endpoint} (${description})...`);
    
    try {
      const response = await axios.delete(`${API_BASE_URL}${endpoint}`, {
        timeout: TEST_TIMEOUT
      });
      
      this.addResult(endpoint, 'DELETE', {
        status: 'success',
        statusCode: response.status,
        message: `Успешно: ${response.status}`
      });
      
      console.log(`  ✓ Успешно: ${response.status}`);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        this.addResult(endpoint, 'DELETE', {
          status: 'timeout',
          message: 'Таймаут'
        });
        console.log(`  ✗ Таймаут`);
      } else if (error.response) {
        // Сервер ответил с кодом ошибки
        this.addResult(endpoint, 'DELETE', {
          status: 'error',
          statusCode: error.response.status,
          message: `Ошибка: ${error.response.status} - ${error.response.statusText}`
        });
        console.log(`  ✗ Ошибка: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Запрос был сделан, но ответа не было
        this.addResult(endpoint, 'DELETE', {
          status: 'error',
          message: 'Нет ответа от сервера'
        });
        console.log(`  ✗ Нет ответа от сервера`);
      } else {
        // Что-то произошло при настройке запроса
        this.addResult(endpoint, 'DELETE', {
          status: 'error',
          message: `Ошибка: ${error.message}`
        });
        console.log(`  ✗ Ошибка: ${error.message}`);
      }
    }
  }

  // Тесты для документов
  private async testDocumentsEndpoints() {
    console.log('\n=== Тестирование API документов ===');
    
    // GET /documents
    await this.testGetEndpoint('/documents', 'Получение списка документов');
    
    // GET /documents/templates
    await this.testGetEndpoint('/documents/templates', 'Получение списка шаблонов документов');
    
    // POST /documents (тест с минимальными данными)
    const testData = {
      title: 'Test Document',
      type: 'contract',
      category: 'staff',
      fileName: 'test.pdf',
      fileSize: 1024,
      filePath: '/uploads/test.pdf',
      uploader: 'test-user'
    };
    
    await this.testPostEndpoint('/documents', testData, 'Создание документа');
    
    // POST /documents/templates (тест с минимальными данными)
    const templateTestData = {
      name: 'Test Template',
      type: 'contract',
      category: 'staff',
      fileName: 'template.docx',
      fileSize: 2048,
      filePath: '/templates/template.docx',
      version: '1.0',
      isActive: true
    };
    
    await this.testPostEndpoint('/documents/templates', templateTestData, 'Создание шаблона документа');
  }

  // Тесты для отчетов по зарплатам
  private async testPayrollReportsEndpoints() {
    console.log('\n=== Тестирование API отчетов по зарплатам ===');
    
    // GET /payroll
    await this.testGetEndpoint('/payroll', 'Получение списка расчетных листов');
    
    // POST /payroll/export (тест с минимальными данными)
    const exportData = {
      format: 'excel',
      startDate: '2025-09-01',
      endDate: '2025-09-30'
    };
    
    await this.testPostEndpoint('/api/payroll/export', exportData, 'Экспорт отчета по зарплатам');
  }

  // Запуск всех тестов
  public async runAllTests() {
    console.log('Запуск тестов API endpoints...\n');
    
    await this.testDocumentsEndpoints();
    await this.testPayrollReportsEndpoints();
    
    // Вывод результатов
    console.log('\n=== Результаты тестирования ===');
    let successCount = 0;
    let errorCount = 0;
    let timeoutCount = 0;
    
    this.results.forEach(result => {
      const statusSymbol = result.status === 'success' ? '✓' : result.status === 'timeout' ? '⏰' : '✗';
      console.log(`${statusSymbol} ${result.method} ${result.endpoint} - ${result.message}`);
      
      if (result.status === 'success') {
        successCount++;
      } else if (result.status === 'timeout') {
        timeoutCount++;
      } else {
        errorCount++;
      }
    });
    
    console.log(`\nИтого: ${successCount} успешных, ${errorCount} ошибок, ${timeoutCount} таймаутов`);
    
    if (errorCount === 0 && timeoutCount === 0) {
      console.log('\n🎉 Все API endpoints работают корректно!');
    } else {
      console.log(`\n❌ Некоторые API endpoints имеют проблемы. Проверьте реализацию.`);
    }
  }
}

// Запуск тестов
const tester = new ApiEndpointTester();
tester.runAllTests().catch(error => {
  console.error('Ошибка при запуске тестов:', error);
});