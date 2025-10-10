import express from 'express';
import {
  getAllShifts,
  createShift,
  updateShift,
  checkIn,
  checkOut,
  getTimeTracking,
  updateAdjustments
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';
import { StaffShiftsService } from './service';

const router = express.Router();
const staffShiftsService = new StaffShiftsService();

// Get all shifts (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllShifts);

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createShift);

// Bulk create shifts
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const shifts = await staffShiftsService.bulkCreate(req.body.shifts || req.body, req.user.id as string);
    res.status(201).json(shifts);
  } catch (err: any) {
    console.error('Error bulk creating shifts:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания смен' });
  }
});

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