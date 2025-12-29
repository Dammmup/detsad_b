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
  // getPendingApprovals,
  // getApprovedRecords,
  // getRejectedRecords,
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



router.post('/clock-in', [
  authMiddleware,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, clockIn);


router.post('/clock-out', [
  authMiddleware,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, clockOut);




router.get('/entries', [
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('status').optional().isIn(['active', 'completed', 'missed', 'pending_approval']).withMessage('Invalid status')
], handleValidationErrors, getEntries);


router.get('/summary', [
  authMiddleware,
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, getSummary);



router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse', 'teacher', 'substitute']), getAllStaffAttendanceRecords);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), createStaffAttendanceRecord);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), updateStaffAttendanceRecord);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), deleteStaffAttendanceRecord);


router.get('/staff/:staffId', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordsByStaffId);


router.get('/range', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceRecordsByDateRange);


router.get('/absences', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getUpcomingAbsences);





router.patch('/:id/notes', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), addStaffAttendanceRecordNotes);


router.patch('/:id/approve', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), approveStaffAttendanceRecord);


router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager', 'doctor', 'nurse']), getStaffAttendanceStatistics);



router.put('/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateStaffAttendanceAdjustments);


router.patch('/:id/approve-time', authMiddleware, authorizeRole(['admin', 'manager']), approveStaffAttendance);


router.patch('/:id/reject', authMiddleware, authorizeRole(['admin', 'manager']), rejectStaffAttendance);


// router.get('/approvals/pending', authMiddleware, authorizeRole(['admin', 'manager']), getPendingApprovals);
// router.get('/records/approved', authMiddleware, authorizeRole(['admin', 'manager']), getApprovedRecords);
// router.get('/records/rejected', authMiddleware, authorizeRole(['admin', 'manager']), getRejectedRecords);


router.get('/arrivals/late', authMiddleware, authorizeRole(['admin', 'manager']), getLateArrivals);


router.get('/leaves/early', authMiddleware, authorizeRole(['admin', 'manager']), getEarlyLeaves);


router.get('/overtime', authMiddleware, authorizeRole(['admin', 'manager']), getOvertimeRecords);


router.get('/absenteeism', authMiddleware, authorizeRole(['admin', 'manager']), getAbsenteeismRecords);


router.get('/stats/work', authMiddleware, authorizeRole(['admin', 'manager']), getWorkDurationStats);


router.get('/stats/break', authMiddleware, authorizeRole(['admin', 'manager']), getBreakDurationStats);


router.get('/rate/attendance', authMiddleware, authorizeRole(['admin', 'manager']), getAttendanceRate);


router.get('/rate/late', authMiddleware, authorizeRole(['admin', 'manager']), getLateArrivalRate);


router.get('/rate/early', authMiddleware, authorizeRole(['admin', 'manager']), getEarlyLeaveRate);


router.get('/rate/overtime', authMiddleware, authorizeRole(['admin', 'manager']), getOvertimeRate);


router.get('/rate/absenteeism', authMiddleware, authorizeRole(['admin', 'manager']), getAbsenteeismRate);

export default router;