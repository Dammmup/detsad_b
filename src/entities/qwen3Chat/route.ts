import { Router } from 'express';
import { sendMessage } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

// Доступ к AI-ассистенту только для админов
router.post('/chat', authMiddleware, authorizeRole(['admin']), sendMessage);

export default router;