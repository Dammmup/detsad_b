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
  getUserTotalFines
} from './controller';
import { authorizeRole } from '../../middlewares/authRole';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Получить список всех пользователей (только для админов)
router.get('/', authMiddleware, authorizeRole(['admin']), getAllUsers);

// Получить доступные роли пользователей
router.get('/roles', getUserRoles);

// Получить одного пользователя по id (только для админов)
router.get('/:id', authMiddleware, authorizeRole(['admin']), getUserById);

// Создать нового пользователя (только для админов)
router.post('/', authMiddleware, authorizeRole(['admin']), createUser);

// Обновить данные пользователя (только для админов)
router.put('/:id', authMiddleware, authorizeRole(['admin']), updateUser);

// Обновить зарплатные и штрафные настройки сотрудника
router.put('/:id/payroll-settings', authMiddleware, authorizeRole(['admin']), updatePayrollSettings);

// Обновить зарплату пользователя
router.put('/:id/salary', authMiddleware, authorizeRole(['admin']), updateUserSalary);

// Добавить штраф пользователю
router.post('/:id/fines', authMiddleware, authorizeRole(['admin']), addUserFine);

// Получить штрафы пользователя
router.get('/:id/fines', authMiddleware, authorizeRole(['admin']), getUserFines);

// Получить общую сумму штрафов пользователя
router.get('/:id/fines/total', authMiddleware, authorizeRole(['admin']), getUserTotalFines);

// Удалить штраф пользователя
router.delete('/:userId/fines/:fineId', authMiddleware, authorizeRole(['admin']), removeUserFine);

// Удалить пользователя (только для админов)
router.delete('/:id', authMiddleware, authorizeRole(['admin']), deleteUser);

export default router;