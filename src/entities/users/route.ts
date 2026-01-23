import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePayrollSettings,
  getUserRoles,
  updateUserSalary,
  addUserFine,
  getUserFines,
  removeUserFine,
  getUserTotalFines,
  generateTelegramCode,
  changePassword
} from './controller';
import { subscribe, unsubscribe } from './pushController';
import { authorizeRole } from '../../middlewares/authRole';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();


router.get('/', authMiddleware, getAllUsers);


router.get('/roles', authMiddleware, getUserRoles);


router.get('/:id', authMiddleware, authorizeRole(['admin']), getUserById);


router.post('/', authMiddleware, authorizeRole(['admin']), createUser);


router.put('/:id', authMiddleware, updateUser);


router.put('/:id/payroll-settings', authMiddleware, authorizeRole(['admin']), updatePayrollSettings);


router.put('/:id/salary', authMiddleware, authorizeRole(['admin']), updateUserSalary);


router.post('/:id/fines', authMiddleware, authorizeRole(['admin']), addUserFine);


router.get('/:id/fines', authMiddleware, authorizeRole(['admin']), getUserFines);


router.get('/:id/fines/total', authMiddleware, authorizeRole(['admin']), getUserTotalFines);


router.delete('/:payrollId/fines/:fineIndex', authMiddleware, authorizeRole(['admin']), removeUserFine);


router.delete('/:id', authMiddleware, authorizeRole(['admin']), deleteUser);


router.post('/:id/generate-telegram-code', authMiddleware, generateTelegramCode);


router.post('/:id/change-password', authMiddleware, changePassword);

// Push Notifications
router.post('/push/subscribe', authMiddleware, subscribe);
router.post('/push/unsubscribe', authMiddleware, unsubscribe);

export default router;
