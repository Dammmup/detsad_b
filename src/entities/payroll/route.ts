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
  generatePayrollSheets,
  generateRentSheets,
  addFine,
  getFines,
  removeFine,
  getTotalFines,
  getMyPayrolls,
  getPayrollBreakdown
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();


router.get('/my', authMiddleware, getMyPayrolls);


router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllPayrolls);


router.get('/by-users', authMiddleware, authorizeRole(['admin', 'manager']), getAllPayrollsByUsers);


router.get('/breakdown/:id', authMiddleware, getPayrollBreakdown);
router.get('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), getPayrollById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createPayroll);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updatePayroll);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deletePayroll);


router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager']), approvePayroll);


router.patch('/:id/mark-paid', authMiddleware, authorizeRole(['admin', 'manager']), markPayrollAsPaid);


router.post('/generate-sheets', authMiddleware, authorizeRole(['admin']), generatePayrollSheets);


router.post('/generate-rent-sheets', authMiddleware, authorizeRole(['admin']), generateRentSheets);


router.post('/:id/fines', authMiddleware, authorizeRole(['admin']), addFine);
router.get('/:id/fines', authMiddleware, getFines);
router.delete('/:payrollId/fines/:fineIndex', authMiddleware, authorizeRole(['admin']), removeFine);
router.get('/:id/fines/total', authMiddleware, getTotalFines);

export default router;