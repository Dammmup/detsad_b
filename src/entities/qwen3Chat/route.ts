import { Router, Request, Response } from 'express';
import { sendMessage } from './controller';
// import { authMiddleware } from '../../middlewares/authMiddleware';
// import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

// Тестовый эндпоинт для проверки что route работает
router.get('/test', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Qwen3Chat route is working!' });
});

// ВРЕМЕННО: убрали авторизацию для отладки
router.post('/chat', sendMessage);

export default router;