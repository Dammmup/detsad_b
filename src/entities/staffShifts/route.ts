import express from 'express';
import {
  getAllShifts,
  createSimpleShift,
  updateSimpleShift,
  deleteSimpleShift,
  checkInSimple,
  checkOutSimple,
  getTimeTrackingSimple,
  updateAdjustmentsSimple
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';
import { ShiftsService } from './service';

const router = express.Router();
const shiftsService = new ShiftsService();

// Get all shifts (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'assistant', 'cook', 'cleaner', 'security', 'nurse']), getAllShifts);

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createSimpleShift);

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
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateSimpleShift);

// Delete shift
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteSimpleShift);

// Check in/out for staff
router.post('/checkin/:shiftId', authMiddleware, checkInSimple);

// Check out
router.post('/checkout/:shiftId', authMiddleware, checkOutSimple);

// Get time tracking records
router.get('/timetracking', authMiddleware, getTimeTrackingSimple);

// Update penalties/bonuses (admin only)
router.put('/timetracking/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateAdjustmentsSimple);

export default router;