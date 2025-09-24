import { validateDocument, validateDocumentTemplate } from '../../utils/validation';

describe('Document Validation', () => {
  describe('validateDocument', () => {
    it('should validate a valid document', () => {
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

      const result = validateDocument(validDocument);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject document with missing required fields', () => {
      const invalidDocument = {
        title: 'Test Document'
        // Missing required fields
      };

      const result = validateDocument(invalidDocument);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Поле "type" обязательно');
      expect(result.errors).toContain('Поле "category" обязательно');
      expect(result.errors).toContain('Поле "fileName" обязательно');
      expect(result.errors).toContain('Поле "fileSize" обязательно');
      expect(result.errors).toContain('Поле "filePath" обязательно');
      expect(result.errors).toContain('Поле "uploader" обязательно');
      expect(result.errors).toContain('Поле "status" обязательно');
    });

    it('should reject document with invalid type', () => {
      const invalidDocument = {
        title: 'Test Document',
        type: 'invalid-type',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: 'user123',
        status: 'active'
      };

      const result = validateDocument(invalidDocument);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Недопустимый тип документа');
    });

    it('should reject document with invalid category', () => {
      const invalidDocument = {
        title: 'Test Document',
        type: 'contract',
        category: 'invalid-category',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: 'user123',
        status: 'active'
      };

      const result = validateDocument(invalidDocument);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Недопустимая категория документа');
    });

    it('should reject document with negative file size', () => {
      const invalidDocument = {
        title: 'Test Document',
        type: 'contract',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: -1024, // Negative file size
        filePath: '/uploads/test.pdf',
        uploader: 'user123',
        status: 'active'
      };

      const result = validateDocument(invalidDocument);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Размер файла не может быть отрицательным');
    });

    it('should reject document with invalid status', () => {
      const invalidDocument = {
        title: 'Test Document',
        type: 'contract',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: 'user123',
        status: 'invalid-status'
      };

      const result = validateDocument(invalidDocument);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Недопустимый статус документа');
    });

    it('should validate document with optional fields', () => {
      const validDocument = {
        title: 'Test Document',
        description: 'This is a test document',
        type: 'contract',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: 'user123',
        status: 'active',
        tags: ['test', 'document'],
        version: '1.0'
      };

      const result = validateDocument(validDocument);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateDocumentTemplate', () => {
    it('should validate a valid document template', () => {
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

      const result = validateDocumentTemplate(validTemplate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        name: 'Test Template'
        // Missing required fields
      };

      const result = validateDocumentTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Поле "type" обязательно');
      expect(result.errors).toContain('Поле "category" обязательно');
      expect(result.errors).toContain('Поле "fileName" обязательно');
      expect(result.errors).toContain('Поле "fileSize" обязательно');
      expect(result.errors).toContain('Поле "filePath" обязательно');
      expect(result.errors).toContain('Поле "isActive" обязательно');
    });

    it('should reject template with invalid type', () => {
      const invalidTemplate = {
        name: 'Test Template',
        type: 'invalid-type',
        category: 'staff',
        fileName: 'template.docx',
        fileSize: 2048,
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true
      };

      const result = validateDocumentTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Недопустимый тип шаблона');
    });

    it('should reject template with invalid category', () => {
      const invalidTemplate = {
        name: 'Test Template',
        type: 'contract',
        category: 'invalid-category',
        fileName: 'template.docx',
        fileSize: 2048,
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true
      };

      const result = validateDocumentTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Недопустимая категория шаблона');
    });

    it('should reject template with negative file size', () => {
      const invalidTemplate = {
        name: 'Test Template',
        type: 'contract',
        category: 'staff',
        fileName: 'template.docx',
        fileSize: -2048, // Negative file size
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true
      };

      const result = validateDocumentTemplate(invalidTemplate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Размер файла не может быть отрицательным');
    });

    it('should validate template with optional fields', () => {
      const validTemplate = {
        name: 'Test Template',
        description: 'This is a test template',
        type: 'contract',
        category: 'staff',
        fileName: 'template.docx',
        fileSize: 2048,
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true,
        tags: ['template', 'contract'],
        usageCount: 5
      };

      const result = validateDocumentTemplate(validTemplate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});