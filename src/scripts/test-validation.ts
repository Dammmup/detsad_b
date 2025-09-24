import { validateDocument, validateDocumentTemplate } from '../utils/validation';

// Тестовые данные для документа
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

const invalidDocument = {
  title: 'Test Document'
  // Отсутствуют обязательные поля
};

// Тестовые данные для шаблона
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

const invalidTemplate = {
  name: 'Test Template'
  // Отсутствуют обязательные поля
};

console.log('=== Тестирование валидации документов ===');

// Тест валидного документа
console.log('\n1. Тест валидного документа:');
const validDocResult = validateDocument(validDocument);
console.log('Результат:', validDocResult.isValid ? 'УСПЕХ' : 'ОШИБКА');
console.log('Ошибки:', validDocResult.errors);

// Тест невалидного документа
console.log('\n2. Тест невалидного документа:');
const invalidDocResult = validateDocument(invalidDocument);
console.log('Результат:', invalidDocResult.isValid ? 'УСПЕХ' : 'ОШИБКА');
console.log('Ошибки:', invalidDocResult.errors);

// Тест валидного шаблона
console.log('\n3. Тест валидного шаблона:');
const validTemplateResult = validateDocumentTemplate(validTemplate);
console.log('Результат:', validTemplateResult.isValid ? 'УСПЕХ' : 'ОШИБКА');
console.log('Ошибки:', validTemplateResult.errors);

// Тест невалидного шаблона
console.log('\n4. Тест невалидного шаблона:');
const invalidTemplateResult = validateDocumentTemplate(invalidTemplate);
console.log('Результат:', invalidTemplateResult.isValid ? 'УСПЕХ' : 'ОШИБКА');
console.log('Ошибки:', invalidTemplateResult.errors);

console.log('\n=== Тестирование завершено ===');