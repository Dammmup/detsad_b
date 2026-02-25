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
import { checkAssistantChildrenAccess } from '../../middlewares/checkAssistantChildrenAccess';

const router = express.Router();

// Маршрут генерации платежей должен быть ДО маршрута /:id
router.post('/generate-payments', authMiddleware, generateMissingPayments);

router.get('/', authMiddleware, checkAssistantChildrenAccess, getAllChildren);


router.get('/:id', authMiddleware, checkAssistantChildrenAccess, getChildById);


router.get('/group/:groupId', authMiddleware, checkAssistantChildrenAccess, getChildrenByGroupId);


router.post('/', authMiddleware, checkAssistantChildrenAccess, createChild);


router.put('/:id', authMiddleware, checkAssistantChildrenAccess, updateChild);


router.delete('/:id', authMiddleware, checkAssistantChildrenAccess, deleteChild);

export default router;