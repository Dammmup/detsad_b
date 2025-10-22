import express from 'express';
import {
  getAllChildren,
  getChildById,
  getChildrenByGroupId,
  createChild,
  updateChild,
  deleteChild
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Получить список всех детей
router.get('/', authMiddleware, getAllChildren);

// Получить одного ребенка по id
router.get('/:id', authMiddleware, getChildById);

// Получить детей по ID группы
router.get('/group/:groupId', authMiddleware, getChildrenByGroupId);

// Создать нового ребенка
router.post('/', authMiddleware, createChild);

// Обновить данные ребенка
router.put('/:id', authMiddleware, updateChild);

// Удалить ребенка
router.delete('/:id', authMiddleware, deleteChild);

export default router;