import express from 'express';
import {
  getAllShifts,
  createShift,
  requestShift,
  updateShift,
  deleteShift,
  checkInSimple,
  checkOutSimple,
  getTimeTrackingSimple,
  updateAdjustmentsSimple,
  updateLateShifts
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';
import { ShiftsService } from './service';

const router = express.Router();
const shiftsService = new ShiftsService();

// Get all shifts (with filters)
router.get('/', authMiddleware, getAllShifts);

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createShift);

// Request a shift (for staff to request additional shifts)
router.post('/request', authMiddleware, requestShift);

// Bulk create shifts
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const shifts = await shiftsService.bulkCreate(req.body.shifts || req.body, req.user.id as string);
    res.status(201).json(shifts);
  } catch (err: any) {
    console.error('Error bulk creating shifts:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания смен' });
  }
});

// Update shift
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateShift);

// Delete shift
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteShift);

// Check in/out for staff
router.post('/checkin/:shiftId', authMiddleware, checkInSimple);

// Check out
router.post('/checkout/:shiftId', authMiddleware, checkOutSimple);

// Get time tracking records
router.get('/timetracking', authMiddleware, getTimeTrackingSimple);

// Update penalties/bonuses (admin only)
router.put('/timetracking/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateAdjustmentsSimple);

// Update late shifts status (admin only)
router.post('/update-late', authMiddleware, authorizeRole(['admin', 'manager']), updateLateShifts);

export default router;