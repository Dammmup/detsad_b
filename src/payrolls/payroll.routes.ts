import express, { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для расчетных листов
router.get('/', authMiddleware, payrollController.getPayrolls);
router.get('/:id', authMiddleware, payrollController.getPayrollById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), payrollController.createPayroll);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), payrollController.updatePayroll);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), payrollController.deletePayroll);
router.post('/calculate-manual', authMiddleware, requireRole(['admin', 'manager']), payrollController.calculateManualPayroll);

export default router;