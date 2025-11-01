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

// Get all food stock logs (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllFoodStockLogs);

// Get food stock log by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogById);

// Create new food stock log
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createFoodStockLog);

// Update food stock log
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStockLog);

// Delete food stock log
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteFoodStockLog);

// Get food stock logs by product ID
router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogsByProductId);

// Get food stock logs by receiver ID
router.get('/receiver/:receiverId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogsByReceiverId);

// Get expiring soon logs
router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);

// Update food stock log status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateFoodStockLogStatus);

// Mark food stock log as used
router.patch('/:id/use', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markFoodStockLogAsUsed);

// Mark food stock log as disposed
router.patch('/:id/dispose', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), markFoodStockLogAsDisposed);

// Add notes to food stock log
router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addFoodStockLogNotes);

// Get food stock log statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getFoodStockLogStatistics);

export default router;