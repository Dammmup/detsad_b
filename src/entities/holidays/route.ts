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


router.get('/', authMiddleware, getAllHolidays);


router.get('/:id', authMiddleware, getHolidayById);


router.get('/check/:date', authMiddleware, checkIfHoliday);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createHoliday);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateHoliday);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteHoliday);

export default router;