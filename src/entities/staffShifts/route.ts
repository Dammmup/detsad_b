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


router.get('/', authMiddleware, getAllShifts);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createShift);


router.post('/request', authMiddleware, requestShift);


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


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateShift);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteShift);


router.post('/checkin/:shiftId', authMiddleware, checkInSimple);


router.post('/checkout/:shiftId', authMiddleware, checkOutSimple);


router.get('/timetracking', authMiddleware, getTimeTrackingSimple);


router.put('/timetracking/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), updateAdjustmentsSimple);


router.post('/update-late', authMiddleware, authorizeRole(['admin', 'manager']), updateLateShifts);

export default router;