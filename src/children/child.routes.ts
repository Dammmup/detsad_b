import express, { Router } from 'express';
import { childController } from './child.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для детей
router.get('/', authMiddleware, childController.getChildren);
router.get('/group/:groupId', authMiddleware, childController.getChildrenByGroupId);
router.get('/parent/:parentId', authMiddleware, childController.getChildrenByParentId);
router.get('/age-group/:ageGroup', authMiddleware, childController.getChildrenByAgeGroup);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), childController.getChildrenStatistics);
router.get('/search', authMiddleware, childController.searchChildrenByName);
router.get('/:id', authMiddleware, childController.getChildById);
router.post('/', authMiddleware, requireRole(['admin', 'manager']), childController.createChild);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager']), childController.updateChild);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), childController.deleteChild);

export default router;