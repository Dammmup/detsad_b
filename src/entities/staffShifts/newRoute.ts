import express from 'express';
import {
  getAllShifts,
  createShift,
  bulkCreateShifts,
  updateShift,
  checkIn,
  checkOut,
  getTimeTracking,
 updateAdjustments
} from './newController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all shifts (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllShifts);

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createShift);

// Bulk create shifts
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'manager']), bulkCreateShifts);

// Update shift
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateShift);

// Check in/out for staff
router.post('/checkin/:shiftId', authMiddleware, checkIn);

// Check out
router.post('/checkout/:shiftId', authMiddleware, checkOut);

// Get time tracking records
router.get('/timetracking', authMiddleware, getTimeTracking);

// Update penalties/bonuses (admin only)
router.put('/timetracking/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateAdjustments);

export default router;