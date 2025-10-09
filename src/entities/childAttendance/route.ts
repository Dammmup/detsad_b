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

// Debug endpoint to check collection status
router.get('/debug', authMiddleware, debugAttendance);

// Get attendance records with filters
router.get('/', authMiddleware, getAllAttendance);

// Create or update attendance record
router.post('/', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), createOrUpdateAttendance);

// Bulk create/update attendance records (for grid save)
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), bulkCreateOrUpdateAttendance);

// Get attendance statistics
router.get('/stats', authMiddleware, getAttendanceStats);

// Delete attendance record
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), deleteAttendance);

export default router;