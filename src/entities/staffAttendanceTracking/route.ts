import express from 'express';
import { 
 clockIn,
  clockOut,
  getEntries,
  getSummary,
  getAllStaffAttendanceRecords,
  getStaffAttendanceRecordById,
  createStaffAttendanceRecord,
  updateStaffAttendanceRecord,
  deleteStaffAttendanceRecord,
  getStaffAttendanceRecordsByStaffId,
  getStaffAttendanceRecordsByDateRange,
  getUpcomingAbsences,
  updateStaffAttendanceRecordStatus,
  addStaffAttendanceRecordNotes,
  approveStaffAttendanceRecord,
  getStaffAttendanceStatistics,
  updateStaffAttendanceAdjustments,
  approveStaffAttendance,
  rejectStaffAttendance,
  getPendingApprovals,
  getApprovedRecords,
 getRejectedRecords,
 getLateArrivals,
  getEarlyLeaves,
  getOvertimeRecords,
 getAbsenteeismRecords,
  getWorkDurationStats,
  getBreakDurationStats,
  getAttendanceRate,
  getLateArrivalRate,
 getEarlyLeaveRate,
  getOvertimeRate,
  getAbsenteeismRate
} from './controller';
import { body, query, validationResult } from 'express-validator';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

// Middleware to check validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const router = express.Router();

// Time tracking routes (from timeTracking)
// POST /attendance/clock-in - Clock in
router.post('/clock-in', [
  authMiddleware,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, clockIn);

// POST /attendance/clock-out - Clock out
router.post('/clock-out', [
 authMiddleware,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, clockOut);



// GET /attendance/entries - Get time entries with pagination
router.get('/entries', [
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('status').optional().isIn(['active', 'completed', 'missed', 'pending_approval']).withMessage('Invalid status')
], handleValidationErrors, getEntries);

// GET /attendance/summary - Get time summary for period
router.get('/summary', [
  authMiddleware,
  query('startDate').isISO8601().withMessage('Invalid start date format'),
 query('endDate').isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, getSummary);

// Staff attendance tracking routes (original)
// Get all staff attendance records (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getAllStaffAttendanceRecords);

// Get staff attendance record by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordById);

// Create new staff attendance record
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createStaffAttendanceRecord);

// Update staff attendance record
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateStaffAttendanceRecord);

// Delete staff attendance record
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteStaffAttendanceRecord);

// Get staff attendance records by staff ID
router.get('/staff/:staffId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordsByStaffId);

// Get staff attendance records by date range
router.get('/range', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordsByDateRange);

// Get upcoming absences
router.get('/absences', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAbsences);

// Update staff attendance record status - теперь использует другой подход, так как поле status больше не существует
// router.patch('/:id/status', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateStaffAttendanceRecordStatus);

// Add notes to staff attendance record
router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addStaffAttendanceRecordNotes);

// Approve staff attendance record
router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), approveStaffAttendanceRecord);

// Get staff attendance statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceStatistics);

// Staff time tracking routes (from staffTimeTracking)
// Update staff attendance adjustments
router.put('/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateStaffAttendanceAdjustments);

// Approve staff attendance record
router.patch('/:id/approve-time', authMiddleware, authorizeRole(['admin', 'manager']), approveStaffAttendance);

// Reject staff attendance record
router.patch('/:id/reject', authMiddleware, authorizeRole(['admin', 'manager']), rejectStaffAttendance);

// Get pending approvals
router.get('/approvals/pending', authMiddleware, authorizeRole(['admin', 'manager']), getPendingApprovals);

// Get approved records
router.get('/records/approved', authMiddleware, authorizeRole(['admin', 'manager']), getApprovedRecords);

// Get rejected records
router.get('/records/rejected', authMiddleware, authorizeRole(['admin', 'manager']), getRejectedRecords);

// Get late arrivals
router.get('/arrivals/late', authMiddleware, authorizeRole(['admin', 'manager']), getLateArrivals);

// Get early leaves
router.get('/leaves/early', authMiddleware, authorizeRole(['admin', 'manager']), getEarlyLeaves);

// Get overtime records
router.get('/overtime', authMiddleware, authorizeRole(['admin', 'manager']), getOvertimeRecords);

// Get absenteeism records
router.get('/absenteeism', authMiddleware, authorizeRole(['admin', 'manager']), getAbsenteeismRecords);

// Get work duration stats
router.get('/stats/work', authMiddleware, authorizeRole(['admin', 'manager']), getWorkDurationStats);

// Get break duration stats
router.get('/stats/break', authMiddleware, authorizeRole(['admin', 'manager']), getBreakDurationStats);

// Get attendance rate
router.get('/rate/attendance', authMiddleware, authorizeRole(['admin', 'manager']), getAttendanceRate);

// Get late arrival rate
router.get('/rate/late', authMiddleware, authorizeRole(['admin', 'manager']), getLateArrivalRate);

// Get early leave rate
router.get('/rate/early', authMiddleware, authorizeRole(['admin', 'manager']), getEarlyLeaveRate);

// Get overtime rate
router.get('/rate/overtime', authMiddleware, authorizeRole(['admin', 'manager']), getOvertimeRate);

// Get absenteeism rate
router.get('/rate/absenteeism', authMiddleware, authorizeRole(['admin', 'manager']), getAbsenteeismRate);

export default router;