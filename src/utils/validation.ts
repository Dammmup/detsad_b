// Валидация документов
export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DocumentData {
  title: string;
  description?: string;
  type: string;
  category: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploader: string;
  uploadDate?: string;
  status: string;
  tags?: string[];
  version?: string;
  expiryDate?: string;
}

export interface TemplateData {
  name: string;
  description?: string;
  type: string;
  category: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  version: string;
  isActive: boolean;
  tags?: string[];
  usageCount?: number;
}

// Допустимые значения для документов
const VALID_DOCUMENT_TYPES = ['contract', 'certificate', 'report', 'policy', 'other'];
const VALID_DOCUMENT_CATEGORIES = ['staff', 'children', 'financial', 'administrative', 'other'];
const VALID_DOCUMENT_STATUSES = ['active', 'archived'];

// Допустимые значения для шаблонов
const VALID_TEMPLATE_TYPES = ['contract', 'certificate', 'report', 'policy', 'other'];
const VALID_TEMPLATE_CATEGORIES = ['staff', 'children', 'financial', 'administrative', 'other'];

/**
 * Валидация данных документа
 * @param document Данные документа для валидации
 * @returns Результат валидации
 */
export const validateDocument = (document: Partial<DocumentData>): DocumentValidationResult => {
  const errors: string[] = [];

  // Проверка обязательных полей
  if (!document.title) {
    errors.push('Поле "title" обязательно');
  }

  if (!document.type) {
    errors.push('Поле "type" обязательно');
  } else if (!VALID_DOCUMENT_TYPES.includes(document.type)) {
    errors.push('Недопустимый тип документа');
  }

  if (!document.category) {
    errors.push('Поле "category" обязательно');
  } else if (!VALID_DOCUMENT_CATEGORIES.includes(document.category)) {
    errors.push('Недопустимая категория документа');
  }

  if (!document.fileName) {
    errors.push('Поле "fileName" обязательно');
  }

  if (document.fileSize === undefined || document.fileSize === null) {
    errors.push('Поле "fileSize" обязательно');
  } else if (document.fileSize < 0) {
    errors.push('Размер файла не может быть отрицательным');
  }

  if (!document.filePath) {
    errors.push('Поле "filePath" обязательно');
  }

  if (!document.uploader) {
    errors.push('Поле "uploader" обязательно');
  }

  if (!document.status) {
    errors.push('Поле "status" обязательно');
  } else if (!VALID_DOCUMENT_STATUSES.includes(document.status)) {
    errors.push('Недопустимый статус документа');
  }

  // Проверка даты истечения срока
  if (document.expiryDate) {
    const expiryDate = new Date(document.expiryDate);
    const uploadDate = document.uploadDate ? new Date(document.uploadDate) : new Date();
    
    if (expiryDate < uploadDate) {
      errors.push('Дата истечения срока должна быть позже даты загрузки');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Валидация данных шаблона документа
 * @param template Данные шаблона для валидации
 * @returns Результат валидации
 */
export const validateDocumentTemplate = (template: Partial<TemplateData>): DocumentValidationResult => {
  const errors: string[] = [];

  // Проверка обязательных полей
  if (!template.name) {
    errors.push('Поле "name" обязательно');
  }

  if (!template.type) {
    errors.push('Поле "type" обязательно');
  } else if (!VALID_TEMPLATE_TYPES.includes(template.type)) {
    errors.push('Недопустимый тип шаблона');
  }

  if (!template.category) {
    errors.push('Поле "category" обязательно');
  } else if (!VALID_TEMPLATE_CATEGORIES.includes(template.category)) {
    errors.push('Недопустимая категория шаблона');
  }

  if (!template.fileName) {
    errors.push('Поле "fileName" обязательно');
  }

  if (template.fileSize === undefined || template.fileSize === null) {
    errors.push('Поле "fileSize" обязательно');
  } else if (template.fileSize < 0) {
    errors.push('Размер файла не может быть отрицательным');
  }

  if (!template.filePath) {
    errors.push('Поле "filePath" обязательно');
  }

  if (template.isActive === undefined || template.isActive === null) {
    errors.push('Поле "isActive" обязательно');
  }

  // Проверка версии
  if (template.version) {
    const versionRegex = /^\d+\.\d+$/;
    if (!versionRegex.test(template.version)) {
      errors.push('Недопустимый формат версии (должен быть в формате X.Y)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Валидация email
 * @param email Email для валидации
 * @returns true если email валиден, иначе false
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидация номера телефона
 * @param phone Номер телефона для валидации
 * @returns true если номер телефона валиден, иначе false
 */
export const validatePhone = (phone: string): boolean => {
  // Простая валидация для казахстанского номера телефона
  const phoneRegex = /^(\+7|8)?7\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Валидация пароля
 * @param password Пароль для валидации
 * @returns true если пароль валиден, иначе false
 */
export const validatePassword = (password: string): boolean => {
  // Минимум 8 символов, хотя бы одна буква и одна цифра
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Валидация ИИН (Индивидуальный идентификационный номер)
 * @param iin ИИН для валидации
 * @returns true если ИИН валиден, иначе false
 */
export const validateIIN = (iin: string): boolean => {
  // ИИН должен состоять из 12 цифр
  if (!/^\d{12}$/.test(iin)) {
    return false;
  }

  // Алгоритм проверки контрольной суммы ИИН
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

  const digits = iin.split('').map(Number);
  let sum = 0;

  // Первый расчет контрольной суммы
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights1[i];
  }

  let controlDigit = sum % 11;
  if (controlDigit === 10) {
    // Второй расчет контрольной суммы
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * weights2[i];
    }
    controlDigit = sum % 11;
    if (controlDigit === 10) {
      controlDigit = 0;
    }
  }

  return controlDigit === digits[11];
};