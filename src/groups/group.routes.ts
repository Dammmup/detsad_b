import express, { Router } from 'express';
import { groupController } from './group.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для групп
router.get('/', authMiddleware, groupController.getGroups);
router.get('/teacher/:teacherId', authMiddleware, groupController.getGroupsByTeacherId);
router.get('/active', authMiddleware, groupController.getActiveGroups);
router.get('/children/:groupId', authMiddleware, groupController.getChildrenInGroup);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), groupController.getGroupStatistics);
router.get('/search', authMiddleware, groupController.searchGroupsByName);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), groupController.createGroup);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), groupController.updateGroup);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), groupController.deleteGroup);

export default router;