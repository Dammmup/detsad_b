import express from 'express';
import {
  getAllChildren,
  getChildById,
  getChildrenByGroupId,
  createChild,
  updateChild,
  deleteChild
} from './controller';

const router = express.Router();

// Получить список всех детей
router.get('/', getAllChildren);

// Получить одного ребенка по id
router.get('/:id', getChildById);

// Получить детей по ID группы
router.get('/group/:groupId', getChildrenByGroupId);

// Создать нового ребенка
router.post('/', createChild);

// Обновить данные ребенка
router.put('/:id', updateChild);

// Удалить ребенка
router.delete('/:id', deleteChild);

export default router;