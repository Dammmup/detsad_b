import express, { Router } from 'express';
import { documentController } from './document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// === Documents ===
router.get('/', authMiddleware, documentController.getDocuments);
router.get('/search', authMiddleware, documentController.searchDocumentsByName);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), documentController.getDocumentStatistics);
router.get('/:id', authMiddleware, documentController.getDocumentById);
router.post('/', authMiddleware, requireRole(['admin', 'manager', 'teacher', 'nurse']), documentController.createDocument);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager', 'teacher', 'nurse']), documentController.updateDocument);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), documentController.deleteDocument);
router.post('/:id/sign', authMiddleware, requireRole(['admin', 'manager', 'teacher', 'nurse']), documentController.signDocument);
router.post('/:id/approve', authMiddleware, requireRole(['admin', 'manager']), documentController.approveDocument);
router.post('/:id/archive', authMiddleware, requireRole(['admin', 'manager']), documentController.archiveDocument);

// === Document Templates ===
router.get('/templates', authMiddleware, documentController.getDocumentTemplates);
router.get('/templates/search', authMiddleware, documentController.searchDocumentTemplatesByName);
router.get('/templates/:id', authMiddleware, documentController.getDocumentTemplateById);
router.post('/templates', authMiddleware, requireRole(['admin', 'manager']), documentController.createDocumentTemplate);
router.put('/templates/:id', authMiddleware, requireRole(['admin', 'manager']), documentController.updateDocumentTemplate);
router.delete('/templates/:id', authMiddleware, requireRole(['admin', 'manager']), documentController.deleteDocumentTemplate);

// === Document Generation ===
router.post('/generate/:templateId', authMiddleware, requireRole(['admin', 'manager', 'teacher', 'nurse']), documentController.generateDocumentFromTemplate);

// === Document Cleanup ===
router.delete('/cleanup/expired', authMiddleware, requireRole(['admin']), documentController.cleanupExpiredDocuments);

export default router;