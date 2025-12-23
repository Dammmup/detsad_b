import { Router } from 'express';
import { sendMessage } from './controller';
// import { authMiddleware } from '../../middlewares/authMiddleware';
// import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

// ВРЕМЕННО: убрали авторизацию для отладки
router.post('/chat', sendMessage);

export default router;