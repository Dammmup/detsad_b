import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import Document from '../../models/Document';
import DocumentTemplate from '../../models/DocumentTemplate';
import documentsRouter from '../../routes/documents';

// Mock Express app for testing
const app = express();
app.use(express.json());
app.use('/api/documents', documentsRouter);

describe('Documents API', () => {
  // Mock data
  const mockDocument = {
    title: 'Test Document',
    type: 'contract',
    category: 'staff',
    fileName: 'test.pdf',
    fileSize: 1024,
    filePath: '/uploads/test.pdf',
    uploader: new mongoose.Types.ObjectId(),
    relatedId: new mongoose.Types.ObjectId(),
    relatedType: 'staff',
    status: 'active',
    tags: ['test', 'document']
  };

  const mockTemplate = {
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

  beforeEach(async () => {
    // Clear database before each test
    await Document.deleteMany({});
    await DocumentTemplate.deleteMany({});
  });

  describe('GET /api/documents', () => {
    it('should return empty array when no documents exist', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return documents with pagination', async () => {
      // Create test documents
      await Document.create(mockDocument);
      await Document.create({
        ...mockDocument,
        title: 'Another Document'
      });

      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter documents by type', async () => {
      // Create documents with different types
      await Document.create({
        ...mockDocument,
        type: 'contract'
      });
      await Document.create({
        ...mockDocument,
        type: 'certificate'
      });

      const response = await request(app)
        .get('/api/documents?type=contract')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].type).toBe('contract');
    });
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const response = await request(app)
        .post('/api/documents')
        .send(mockDocument)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(mockDocument.title);
      expect(response.body.data.type).toBe(mockDocument.type);
      expect(response.body.message).toBe('Документ успешно создан');
    });

    it('should return error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/documents')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return a specific document', async () => {
      const createdDoc = await Document.create(mockDocument);
      
      const response = await request(app)
        .get(`/api/documents/${createdDoc._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(mockDocument.title);
      expect(response.body.data._id).toBe(createdDoc._id.toString());
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/documents/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Документ не найден');
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('should update an existing document', async () => {
      const createdDoc = await Document.create(mockDocument);
      const updatedTitle = 'Updated Document Title';
      
      const response = await request(app)
        .put(`/api/documents/${createdDoc._id}`)
        .send({
          title: updatedTitle
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updatedTitle);
      expect(response.body.message).toBe('Документ успешно обновлен');
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/documents/${fakeId}`)
        .send({
          title: 'Updated Title'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Документ не найден');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete an existing document', async () => {
      const createdDoc = await Document.create(mockDocument);
      
      const response = await request(app)
        .delete(`/api/documents/${createdDoc._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Документ успешно удален');

      // Verify document was deleted
      const deletedDoc = await Document.findById(createdDoc._id);
      expect(deletedDoc).toBeNull();
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/documents/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Документ не найден');
    });
  });

  describe('GET /api/documents/templates', () => {
    it('should return empty array when no templates exist', async () => {
      const response = await request(app)
        .get('/api/documents/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return templates with pagination', async () => {
      // Create test templates
      await DocumentTemplate.create(mockTemplate);
      await DocumentTemplate.create({
        ...mockTemplate,
        name: 'Another Template'
      });

      const response = await request(app)
        .get('/api/documents/templates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('POST /api/documents/templates', () => {
    it('should create a new document template', async () => {
      const response = await request(app)
        .post('/api/documents/templates')
        .send(mockTemplate)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(mockTemplate.name);
      expect(response.body.data.type).toBe(mockTemplate.type);
      expect(response.body.message).toBe('Шаблон документа успешно создан');
    });
  });

  describe('PUT /api/documents/templates/:id', () => {
    it('should update an existing template', async () => {
      const createdTemplate = await DocumentTemplate.create(mockTemplate);
      const updatedName = 'Updated Template Name';
      
      const response = await request(app)
        .put(`/api/documents/templates/${createdTemplate._id}`)
        .send({
          name: updatedName
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedName);
      expect(response.body.message).toBe('Шаблон документа успешно обновлен');
    });
  });

  describe('DELETE /api/documents/templates/:id', () => {
    it('should delete an existing template', async () => {
      const createdTemplate = await DocumentTemplate.create(mockTemplate);
      
      const response = await request(app)
        .delete(`/api/documents/templates/${createdTemplate._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Шаблон документа успешно удален');

      // Verify template was deleted
      const deletedTemplate = await DocumentTemplate.findById(createdTemplate._id);
      expect(deletedTemplate).toBeNull();
    });
  });
});