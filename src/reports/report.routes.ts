import express, { Router } from 'express';
import { reportController } from './report.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// === Reports ===
router.get('/', authMiddleware, reportController.getReports);
router.get('/search', authMiddleware, reportController.searchReportsByName);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), reportController.getReportStatistics);
router.get('/:id', authMiddleware, reportController.getReportById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), reportController.createReport);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), reportController.updateReport);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), reportController.deleteReport);
router.post('/:id/execute', authMiddleware, requireRole(['admin', 'manager']), reportController.executeReport);

// === Report Templates ===
router.get('/templates', authMiddleware, reportController.getReportTemplates);
router.get('/templates/search', authMiddleware, reportController.searchReportTemplatesByName);
router.get('/templates/:id', authMiddleware, reportController.getReportTemplateById);
router.post('/templates', authMiddleware, requireRole(['admin', 'manager']), reportController.createReportTemplate);
router.put('/templates/:id', authMiddleware, requireRole(['admin', 'manager']), reportController.updateReportTemplate);
router.delete('/templates/:id', authMiddleware, requireRole(['admin', 'manager']), reportController.deleteReportTemplate);

// === Report Generation ===
router.post('/generate/:templateId', authMiddleware, requireRole(['admin', 'manager']), reportController.generateReportFromTemplate);

// === Salary Reports ===
router.get('/salary', authMiddleware, requireRole(['admin', 'manager']), reportController.getSalaryReports);

// === Report Cleanup ===
router.delete('/cleanup/expired', authMiddleware, requireRole(['admin']), reportController.cleanupExpiredReports);

export default router;