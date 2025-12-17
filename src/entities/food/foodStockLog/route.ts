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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllFoodStockLogs);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createFoodStockLog);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStockLog);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteFoodStockLog);


router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogsByProductId);


router.get('/receiver/:receiverId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogsByReceiverId);


router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStockLogStatus);


router.patch('/:id/use', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markFoodStockLogAsUsed);


router.patch('/:id/dispose', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markFoodStockLogAsDisposed);


router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addFoodStockLogNotes);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogStatistics);

export default router;