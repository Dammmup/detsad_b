import express, { Router } from 'express';
import { financeController } from './finance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для финансовых операций
router.get('/', authMiddleware, financeController.getFinances);
router.get('/type/:type', authMiddleware, financeController.getFinancesByType);
router.get('/category/:category', authMiddleware, financeController.getFinancesByCategory);
router.get('/status/:status', authMiddleware, financeController.getFinancesByStatus);
router.get('/user/:userId', authMiddleware, financeController.getFinancesByUserId);
router.get('/date-range', authMiddleware, financeController.getFinancesByDateRange);
router.get('/payment-method/:paymentMethod', authMiddleware, financeController.getFinancesByPaymentMethod);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), financeController.getFinanceStatistics);
router.get('/search', authMiddleware, financeController.searchFinancesByName);
router.get('/tags', authMiddleware, financeController.getFinancesByTags);
router.get('/:id', authMiddleware, financeController.getFinanceById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), financeController.createFinance);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), financeController.updateFinance);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), financeController.deleteFinance);
router.post('/:id/approve', authMiddleware, requireRole(['admin', 'manager']), financeController.approveFinance);
router.post('/:id/cancel', authMiddleware, requireRole(['admin', 'manager']), financeController.cancelFinance);

export default router;