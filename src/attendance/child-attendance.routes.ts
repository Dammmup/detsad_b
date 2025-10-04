import express, { Router } from 'express';
import { childAttendanceController } from './child-attendance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для посещаемости детей
router.get('/', authMiddleware, childAttendanceController.getChildAttendances);
router.get('/child/:childId', authMiddleware, childAttendanceController.getChildAttendancesByChildId);
router.get('/group/:groupId', authMiddleware, childAttendanceController.getChildAttendancesByGroupId);
router.get('/date-range', authMiddleware, childAttendanceController.getChildAttendancesByDateRange);
router.get('/summary', authMiddleware, childAttendanceController.getAttendanceSummary);
router.get('/:id', authMiddleware, childAttendanceController.getChildAttendanceById);
router.post('/', authMiddleware, requireRole(['admin', 'manager', 'teacher']), childAttendanceController.createChildAttendance);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager', 'teacher']), childAttendanceController.updateChildAttendance);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), childAttendanceController.deleteChildAttendance);

export default router;