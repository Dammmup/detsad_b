import express, { Router } from 'express';
import { shiftController } from './shift.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для смен
router.get('/', authMiddleware, shiftController.getShifts);
router.get('/staff/:staffId', authMiddleware, shiftController.getShiftsByStaffId);
router.get('/date-range', authMiddleware, shiftController.getShiftsByDateRange);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), shiftController.getShiftStatistics);
router.get('/search', authMiddleware, shiftController.searchShiftsByName);
router.get('/:id', authMiddleware, shiftController.getShiftById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), shiftController.createShift);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), shiftController.updateShift);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), shiftController.deleteShift);

export default router;