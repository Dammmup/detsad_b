// Скрипт для запуска тестов валидации без Jest
import { validateDocument, validateDocumentTemplate } from '../utils/validation';

interface TestResult {
  name: string;
  passed: boolean;
  errors: string[];
}

class ValidationTester {
  private tests: TestResult[] = [];

  // Добавление теста
  private addTest(name: string, passed: boolean, errors: string[] = []) {
    this.tests.push({ name, passed, errors });
  }

  // Тесты для документов
  private testDocuments() {
    console.log('=== Тестирование валидации документов ===\n');

    // Тест 1: Валидный документ
    const validDocument = {
      title: 'Test Document',
      type: 'contract',
      category: 'staff',
      fileName: 'test.pdf',
      fileSize: 1024,
      filePath: '/uploads/test.pdf',
      uploader: 'user123',
      status: 'active'
    };

    const result1 = validateDocument(validDocument);
    this.addTest('Валидный документ', result1.isValid, result1.errors);
    console.log(`1. Валидный документ: ${result1.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (!result1.isValid) {
      console.log(`   Ошибки: ${result1.errors.join(', ')}`);
    }

    // Тест 2: Невалидный документ (отсутствуют обязательные поля)
    const invalidDocument = {
      title: 'Test Document'
      // Отсутствуют обязательные поля
    };

    const result2 = validateDocument(invalidDocument);
    this.addTest('Невалидный документ (отсутствуют поля)', !result2.isValid, result2.errors);
    console.log(`2. Невалидный документ (отсутствуют поля): ${!result2.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result2.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получены ошибки: ${result2.errors.join(', ')}`);
    }

    // Тест 3: Невалидный тип документа
    const invalidTypeDocument = {
      title: 'Test Document',
      type: 'invalid-type',
      category: 'staff',
      fileName: 'test.pdf',
      fileSize: 1024,
      filePath: '/uploads/test.pdf',
      uploader: 'user123',
      status: 'active'
    };

    const result3 = validateDocument(invalidTypeDocument);
    this.addTest('Невалидный тип документа', !result3.isValid, result3.errors);
    console.log(`3. Невалидный тип документа: ${!result3.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result3.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получена ошибка: ${result3.errors.join(', ')}`);
    }

    // Тест 4: Отрицательный размер файла
    const negativeSizeDocument = {
      title: 'Test Document',
      type: 'contract',
      category: 'staff',
      fileName: 'test.pdf',
      fileSize: -1024, // Отрицательный размер
      filePath: '/uploads/test.pdf',
      uploader: 'user123',
      status: 'active'
    };

    const result4 = validateDocument(negativeSizeDocument);
    this.addTest('Отрицательный размер файла', !result4.isValid, result4.errors);
    console.log(`4. Отрицательный размер файла: ${!result4.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result4.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получена ошибка: ${result4.errors.join(', ')}`);
    }

    console.log('\n');
  }

  // Тесты для шаблонов документов
  private testTemplates() {
    console.log('=== Тестирование валидации шаблонов ===\n');

    // Тест 1: Валидный шаблон
    const validTemplate = {
      name: 'Test Template',
      type: 'contract',
      category: 'staff',
      fileName: 'template.docx',
      fileSize: 2048,
      filePath: '/templates/template.docx',
      version: '1.0',
      isActive: true
    };

    const result1 = validateDocumentTemplate(validTemplate);
    this.addTest('Валидный шаблон', result1.isValid, result1.errors);
    console.log(`1. Валидный шаблон: ${result1.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (!result1.isValid) {
      console.log(`   Ошибки: ${result1.errors.join(', ')}`);
    }

    // Тест 2: Невалидный шаблон (отсутствуют обязательные поля)
    const invalidTemplate = {
      name: 'Test Template'
      // Отсутствуют обязательные поля
    };

    const result2 = validateDocumentTemplate(invalidTemplate);
    this.addTest('Невалидный шаблон (отсутствуют поля)', !result2.isValid, result2.errors);
    console.log(`2. Невалидный шаблон (отсутствуют поля): ${!result2.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result2.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получены ошибки: ${result2.errors.join(', ')}`);
    }

    // Тест 3: Невалидная категория шаблона
    const invalidCategoryTemplate = {
      name: 'Test Template',
      type: 'contract',
      category: 'invalid-category',
      fileName: 'template.docx',
      fileSize: 2048,
      filePath: '/templates/template.docx',
      version: '1.0',
      isActive: true
    };

    const result3 = validateDocumentTemplate(invalidCategoryTemplate);
    this.addTest('Невалидная категория шаблона', !result3.isValid, result3.errors);
    console.log(`3. Невалидная категория шаблона: ${!result3.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result3.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получена ошибка: ${result3.errors.join(', ')}`);
    }

    // Тест 4: Отрицательный размер файла шаблона
    const negativeSizeTemplate = {
      name: 'Test Template',
      type: 'contract',
      category: 'staff',
      fileName: 'template.docx',
      fileSize: -2048, // Отрицательный размер
      filePath: '/templates/template.docx',
      version: '1.0',
      isActive: true
    };

    const result4 = validateDocumentTemplate(negativeSizeTemplate);
    this.addTest('Отрицательный размер файла шаблона', !result4.isValid, result4.errors);
    console.log(`4. Отрицательный размер файла шаблона: ${!result4.isValid ? 'УСПЕХ' : 'ОШИБКА'}`);
    if (result4.isValid) {
      console.log('   Ожидалась ошибка, но валидация прошла успешно');
    } else {
      console.log(`   Получена ошибка: ${result4.errors.join(', ')}`);
    }

    console.log('\n');
  }

  // Запуск всех тестов
  public runTests() {
    console.log('Запуск тестов валидации...\n');

    this.testDocuments();
    this.testTemplates();

    // Вывод результатов
    console.log('=== Результаты тестирования ===');
    let passed = 0;
    let failed = 0;

    this.tests.forEach(test => {
      if (test.passed) {
        passed++;
        console.log(`✓ ${test.name}`);
      } else {
        failed++;
        console.log(`✗ ${test.name}`);
        if (test.errors.length > 0) {
          console.log(`   Ошибки: ${test.errors.join(', ')}`);
        }
      }
    });

    console.log(`\nИтого: ${passed} пройдено, ${failed} провалено`);
    
    if (failed === 0) {
      console.log('\n🎉 Все тесты пройдены успешно!');
    } else {
      console.log(`\n❌ ${failed} тестов провалены. Проверьте реализацию.`);
    }
  }
}

// Запуск тестов
const tester = new ValidationTester();
tester.runTests();