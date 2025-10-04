import express, { Router } from 'express';
import { menuController } from './menu.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// === Menu Items ===
router.get('/items', authMiddleware, menuController.getMenuItems);
router.get('/items/search', authMiddleware, menuController.searchMenuItemsByName);
router.get('/items/:id', authMiddleware, menuController.getMenuItemById);
router.post('/items', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.createMenuItem);
router.put('/items/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.updateMenuItem);
router.delete('/items/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.deleteMenuItem);

// === Cyclograms ===
router.get('/cyclograms', authMiddleware, menuController.getCyclograms);
router.get('/cyclograms/search', authMiddleware, menuController.searchCyclogramsByName);
router.get('/cyclograms/:id', authMiddleware, menuController.getCyclogramById);
router.post('/cyclograms', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.createCyclogram);
router.put('/cyclograms/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.updateCyclogram);
router.delete('/cyclograms/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.deleteCyclogram);

// === Schedules ===
router.get('/schedules', authMiddleware, menuController.getSchedules);
router.get('/schedules/date/:date', authMiddleware, menuController.getSchedulesByDate);
router.get('/schedules/period', authMiddleware, menuController.getSchedulesByPeriod);
router.get('/schedules/cyclogram/:cyclogramId', authMiddleware, menuController.getSchedulesByCyclogramId);
router.get('/schedules/:id', authMiddleware, menuController.getScheduleById);
router.post('/schedules', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.createSchedule);
router.put('/schedules/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.updateSchedule);
router.delete('/schedules/:id', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.deleteSchedule);
router.post('/schedules/:id/publish', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.publishSchedule);
router.post('/schedules/:id/unpublish', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.unpublishSchedule);

// === Menu Statistics ===
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager', 'cook']), menuController.getMenuStatistics);

export default router;