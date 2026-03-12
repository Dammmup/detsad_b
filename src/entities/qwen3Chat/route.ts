import { Router } from 'express';
import { sendMessage, createDish, confirmAction } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

// Доступ к AI-ассистенту только для админов
router.post('/chat', authMiddleware, authorizeRole(['admin']), sendMessage);

// Эндпоинт для подтверждения CRUD операций пользователем
router.post('/confirm', authMiddleware, authorizeRole(['admin']), confirmAction);

// Создание блюда через AI
router.post('/create-dish', authMiddleware, authorizeRole(['admin']), createDish);


export default router;
