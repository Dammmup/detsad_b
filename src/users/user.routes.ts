import express, { Router } from 'express';
import { userController } from './user.controller';

const router: Router = express.Router();

// Маршруты для пользователей
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.put('/:id/payroll-settings', userController.updatePayrollSettings);
router.delete('/:id', userController.deleteUser);

export default router;