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


router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllDetergentLogs);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createDetergentLog);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateDetergentLog);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteDetergentLog);


router.get('/product/:productId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogsByProductId);


router.get('/receiver/:receiverId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogsByReceiverId);


router.get('/expiring', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getExpiringSoon);


router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateDetergentLogStatus);


router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addDetergentLogNotes);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getDetergentLogStatistics);

export default router;