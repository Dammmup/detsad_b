import express from 'express';
import { create, getAll, getById, update, deleteItem, getByPeriod } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Основные маршруты
router.post('/', authMiddleware, create);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, deleteItem);

// Дополнительные маршруты
router.get('/period/:period', authMiddleware, getByPeriod);

export default router;