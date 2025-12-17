import express from 'express';
import {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByCategoryAndDay,
  getWeeklyMenu,
  toggleMenuItemAvailability,
  searchMenuItems,
  getMenuItemsByAllergen,
  getMenuNutritionalStatistics
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, getAllMenuItems);


router.get('/search', authMiddleware, searchMenuItems);


router.get('/allergen/:allergen', authMiddleware, getMenuItemsByAllergen);


router.get('/statistics/nutrition', authMiddleware, getMenuNutritionalStatistics);


router.get('/weekly', authMiddleware, getWeeklyMenu);


router.get('/category/:category/day/:dayOfWeek', authMiddleware, getMenuItemsByCategoryAndDay);


router.get('/:id', authMiddleware, getMenuItemById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), createMenuItem);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), updateMenuItem);


router.patch('/:id/toggle', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), toggleMenuItemAvailability);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), deleteMenuItem);

export default router;