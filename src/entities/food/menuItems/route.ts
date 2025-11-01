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

// Get all menu items (with filters)
router.get('/', authMiddleware, getAllMenuItems);

// Search menu items
router.get('/search', authMiddleware, searchMenuItems);

// Get menu items by allergen
router.get('/allergen/:allergen', authMiddleware, getMenuItemsByAllergen);

// Get nutritional statistics
router.get('/statistics/nutrition', authMiddleware, getMenuNutritionalStatistics);

// Get weekly menu
router.get('/weekly', authMiddleware, getWeeklyMenu);

// Get menu items by category and day
router.get('/category/:category/day/:dayOfWeek', authMiddleware, getMenuItemsByCategoryAndDay);

// Get menu item by ID
router.get('/:id', authMiddleware, getMenuItemById);

// Create new menu item
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), createMenuItem);

// Update menu item
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), updateMenuItem);

// Toggle menu item availability
router.patch('/:id/toggle', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), toggleMenuItemAvailability);

// Delete menu item
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), deleteMenuItem);

export default router;