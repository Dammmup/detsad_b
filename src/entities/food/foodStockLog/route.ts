import express from 'express';
import {
  getAllFoodStockLogs,
  getFoodStockLogById,
  createFoodStockLog,
  updateFoodStockLog,
  deleteFoodStockLog,
  getFoodStockLogsByProductId,
  getFoodStockLogsByReceiverId,
  getExpiringSoon,
  updateFoodStockLogStatus,
  markFoodStockLogAsUsed,
  markFoodStockLogAsDisposed,
  addFoodStockLogNotes,
  getFoodStockLogStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

const auth = [authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse'])] as const;

// Специфические GET-маршруты ПЕРЕД /:id
router.get('/', ...auth, getAllFoodStockLogs);
router.get('/expiring', ...auth, getExpiringSoon);
router.get('/statistics', ...auth, getFoodStockLogStatistics);
router.get('/product/:productId', ...auth, getFoodStockLogsByProductId);
router.get('/receiver/:receiverId', ...auth, getFoodStockLogsByReceiverId);
router.get('/:id', ...auth, getFoodStockLogById);

router.post('/', ...auth, createFoodStockLog);
router.put('/:id', ...auth, updateFoodStockLog);
router.delete('/:id', ...auth, deleteFoodStockLog);
router.patch('/:id/status', ...auth, updateFoodStockLogStatus);
router.patch('/:id/use', ...auth, markFoodStockLogAsUsed);
router.patch('/:id/dispose', ...auth, markFoodStockLogAsDisposed);
router.patch('/:id/notes', ...auth, addFoodStockLogNotes);

export default router;
