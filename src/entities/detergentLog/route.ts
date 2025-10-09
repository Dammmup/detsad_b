import express from 'express';
import { 
  getAllDetergentLogs,
  getDetergentLogById,
  createDetergentLog,
  updateDetergentLog,
  deleteDetergentLog,
  getDetergentLogsByProductId,
  getDetergentLogsByReceiverId,
  getExpiringSoon,
  updateDetergentLogStatus,
  addDetergentLogNotes,
  getDetergentLogStatistics
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all detergent logs (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllDetergentLogs);

// Get detergent log by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogById);

// Create new detergent log
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createDetergentLog);

// Update detergent log
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateDetergentLog);

// Delete detergent log
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteDetergentLog);

// Get detergent logs by product ID
router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogsByProductId);

// Get detergent logs by receiver ID
router.get('/receiver/:receiverId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogsByReceiverId);

// Get expiring soon logs
router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);

// Update detergent log status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateDetergentLogStatus);

// Add notes to detergent log
router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addDetergentLogNotes);

// Get detergent log statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogStatistics);

export default router;