import express from 'express';
import {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  checkIfHoliday
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all holidays (with filters)
router.get('/', authMiddleware, getAllHolidays);

// Get holiday by ID
router.get('/:id', authMiddleware, getHolidayById);

// Check if a date is a holiday
router.get('/check/:date', authMiddleware, checkIfHoliday);

// Create new holiday
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createHoliday);

// Update holiday
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateHoliday);

// Delete holiday
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteHoliday);

export default router;