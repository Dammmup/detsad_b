import { Router } from 'express';
import AuthController from './auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Публичные маршруты
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Защищенные маршруты (требуют аутентификации)
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/change-password', authMiddleware, AuthController.changePassword);

// Маршруты для администраторов
router.get('/users', authMiddleware, AuthController.getAllUsers);
router.patch('/users/toggle-status', authMiddleware, AuthController.toggleUserStatus);

export default router;