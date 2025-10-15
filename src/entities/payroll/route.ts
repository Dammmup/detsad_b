import express from 'express';
import {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  approvePayroll,
  markPayrollAsPaid,
  getAllPayrollsByUsers,
  generatePayrollSheets
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Получить все зарплаты (с фильтрами)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllPayrolls);

// Получить все зарплаты на основе пользователей
router.get('/by-users', authMiddleware, authorizeRole(['admin', 'manager']), getAllPayrollsByUsers);

// Получить зарплату по ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager']), getPayrollById);

// Создать новую зарплату
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createPayroll);

// Обновить зарплату
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updatePayroll);

// Удалить зарплату
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deletePayroll);

// Подтвердить зарплату
router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager']), approvePayroll);

// Отметить зарплату как оплаченную
router.patch('/:id/mark-paid', authMiddleware, authorizeRole(['admin', 'manager']), markPayrollAsPaid);

// Сгенерировать расчетные листы
router.post('/generate-sheets', authMiddleware, authorizeRole(['admin']), generatePayrollSheets);

export default router;