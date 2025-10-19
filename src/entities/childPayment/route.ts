import express from 'express';
import { create, getAll, getById, update, deleteItem, getByPeriod } from './controller';

const router = express.Router();

// Основные маршруты
router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', deleteItem);

// Дополнительные маршруты
router.get('/period/:period', getByPeriod);

export default router;