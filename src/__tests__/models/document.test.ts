import mongoose from 'mongoose';
import Document from '../../models/Document';
import DocumentTemplate from '../../models/DocumentTemplate';

describe('Document Model', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);
  });

  afterAll(async () => {
    // Clean up and disconnect
    await Document.deleteMany({});
    await DocumentTemplate.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Document Schema', () => {
    it('should create a document with required fields', async () => {
      const documentData = {
        title: 'Test Document',
        type: 'contract',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: new mongoose.Types.ObjectId(),
        status: 'active',
        tags: ['test', 'document']
      };

      const document = new Document(documentData);
      await document.save();

      expect(document.title).toBe(documentData.title);
      expect(document.type).toBe(documentData.type);
      expect(document.category).toBe(documentData.category);
      expect(document.fileName).toBe(documentData.fileName);
      expect(document.fileSize).toBe(documentData.fileSize);
      expect(document.filePath).toBe(documentData.filePath);
      expect(document.status).toBe(documentData.status);
      expect(document.tags).toEqual(documentData.tags);
    });

    it('should fail validation when required fields are missing', async () => {
      const document = new Document({
        // Missing required fields
      });

      let error;
      try {
        await document.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should validate enum values', async () => {
      const document = new Document({
        title: 'Invalid Document',
        type: 'invalid-type', // Should fail validation
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: new mongoose.Types.ObjectId(),
        status: 'active'
      });

      let error;
      try {
        await document.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should validate date relationships', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      
      const document = new Document({
        title: 'Future Document',
        type: 'contract',
        category: 'staff',
        fileName: 'test.pdf',
        fileSize: 1024,
        filePath: '/uploads/test.pdf',
        uploader: new mongoose.Types.ObjectId(),
        uploadDate: new Date(),
        expiryDate: futureDate,
        status: 'active'
      });

      // Should save successfully with valid dates
      await document.save();
      expect(document.expiryDate).toEqual(futureDate);
    });
  });

  describe('DocumentTemplate Schema', () => {
    it('should create a template with required fields', async () => {
      const templateData = {
        name: 'Test Template',
        type: 'contract',
        category: 'staff',
        fileName: 'template.docx',
        fileSize: 2048,
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true,
        tags: ['template', 'contract']
      };

      const template = new DocumentTemplate(templateData);
      await template.save();

      expect(template.name).toBe(templateData.name);
      expect(template.type).toBe(templateData.type);
      expect(template.category).toBe(templateData.category);
      expect(template.fileName).toBe(templateData.fileName);
      expect(template.fileSize).toBe(templateData.fileSize);
      expect(template.filePath).toBe(templateData.filePath);
      expect(template.version).toBe(templateData.version);
      expect(template.isActive).toBe(templateData.isActive);
      expect(template.tags).toEqual(templateData.tags);
      expect(template.usageCount).toBe(0); // Default value
    });

    it('should fail validation when required fields are missing', async () => {
      const template = new DocumentTemplate({
        // Missing required fields
      });

      let error;
      try {
        await template.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });

    it('should validate enum values', async () => {
      const template = new DocumentTemplate({
        name: 'Invalid Template',
        type: 'invalid-type', // Should fail validation
        category: 'staff',
        fileName: 'template.docx',
        fileSize: 2048,
        filePath: '/templates/template.docx',
        version: '1.0',
        isActive: true
      });

      let error;
      try {
        await template.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('ValidationError');
    });
  });
});