import express from 'express';
import {
  getAllChildren,
  getChildById,
  getChildrenByGroupId,
  createChild,
  updateChild,
  deleteChild,
  generateMissingPayments
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Маршрут генерации платежей должен быть ДО маршрута /:id
router.post('/generate-payments', authMiddleware, generateMissingPayments);

router.get('/', authMiddleware, getAllChildren);


router.get('/:id', authMiddleware, getChildById);


router.get('/group/:groupId', authMiddleware, getChildrenByGroupId);


router.post('/', authMiddleware, createChild);


router.put('/:id', authMiddleware, updateChild);


router.delete('/:id', authMiddleware, deleteChild);

export default router;