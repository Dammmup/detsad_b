import express from 'express';
import {
  getAllSimpleShifts,
  createSimpleShift,
  updateSimpleShift,
  deleteSimpleShift,
  checkInSimple,
  checkOutSimple,
  getTimeTrackingSimple,
  updateAdjustmentsSimple
} from './simpleController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';
import { SimpleShiftsService } from './simpleService';

const router = express.Router();
const simpleShiftsService = new SimpleShiftsService();

// Get all shifts (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllSimpleShifts);

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createSimpleShift);

// Bulk create shifts
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const shifts = await simpleShiftsService.bulkCreate(req.body.shifts || req.body, req.user.id as string);
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