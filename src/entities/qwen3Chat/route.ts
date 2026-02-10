import { Router } from 'express';
import { sendMessage, createDish } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

// Доступ к AI-ассистенту только для админов
router.post('/chat', authMiddleware, authorizeRole(['admin']), sendMessage);

// Новый эндпоинт для создания блюда через AI
router.post('/create-dish', authMiddleware, authorizeRole(['admin']), createDish);


export default router;