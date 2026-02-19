import express from 'express';
import {
  getAllAttendance,
  createOrUpdateAttendance,
  bulkCreateOrUpdateAttendance,
  getAttendanceStats,
  deleteAttendance,
  debugAttendance
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();


router.get('/debug', authMiddleware, authorizeRole(['admin']), debugAttendance);


router.get('/', authMiddleware, getAllAttendance);


router.post('/', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), createOrUpdateAttendance);


router.post('/bulk', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), bulkCreateOrUpdateAttendance);


router.get('/stats', authMiddleware, getAttendanceStats);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), deleteAttendance);

export default router;