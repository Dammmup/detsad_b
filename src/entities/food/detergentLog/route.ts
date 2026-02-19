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
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

const auth = [authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse'])] as const;

// Специфические GET-маршруты ПЕРЕД /:id
router.get('/', ...auth, getAllDetergentLogs);
router.get('/expiring', ...auth, getExpiringSoon);
router.get('/statistics', ...auth, getDetergentLogStatistics);
router.get('/product/:productId', ...auth, getDetergentLogsByProductId);
router.get('/receiver/:receiverId', ...auth, getDetergentLogsByReceiverId);
router.get('/:id', ...auth, getDetergentLogById);

router.post('/', ...auth, createDetergentLog);
router.put('/:id', ...auth, updateDetergentLog);
router.delete('/:id', ...auth, deleteDetergentLog);
router.patch('/:id/status', ...auth, updateDetergentLogStatus);
router.patch('/:id/notes', ...auth, addDetergentLogNotes);

export default router;
