import express, { Router } from 'express';
import { payrollController } from './payroll.controller';

const router: Router = express.Router();

// Маршруты для расчетных листов
router.get('/', payrollController.getPayrolls);
router.get('/:id', payrollController.getPayrollById);
router.post('/', payrollController.createPayroll);
router.put('/:id', payrollController.updatePayroll);
router.delete('/:id', payrollController.deletePayroll);
router.post('/calculate-manual', payrollController.calculateManualPayroll);

export default router;