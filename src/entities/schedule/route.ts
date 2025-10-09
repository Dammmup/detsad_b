import express from 'express';
import { 
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByStaffId,
  getSchedulesByGroupId,
  getSchedulesByDate,
  getSchedulesByDateRange,
  getUpcomingSchedules,
  updateScheduleStatus,
  addScheduleNotes,
  getScheduleStatistics
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all schedules (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllSchedules);

// Get schedule by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getScheduleById);

// Create new schedule
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createSchedule);

// Update schedule
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateSchedule);

// Delete schedule
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteSchedule);

// Get schedules by staff ID
router.get('/staff/:staffId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSchedulesByStaffId);

// Get schedules by group ID
router.get('/group/:groupId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSchedulesByGroupId);

// Get schedules by date
router.get('/date/:date', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSchedulesByDate);

// Get schedules by date range
router.get('/range', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getSchedulesByDateRange);

// Get upcoming schedules
router.get('/upcoming', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingSchedules);

// Update schedule status
router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateScheduleStatus);

// Add notes to schedule
router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addScheduleNotes);

// Get schedule statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getScheduleStatistics);

export default router;