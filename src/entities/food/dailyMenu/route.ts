import express from 'express';
import {
    getAllDailyMenus,
    getDailyMenuById,
    getDailyMenuByDate,
    getTodayMenu,
    createDailyMenu,
    updateDailyMenu,
    deleteDailyMenu,
    serveMeal,
    cancelMeal,
    addDishToMeal,
    removeDishFromMeal
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Получить все меню
router.get('/', authMiddleware, getAllDailyMenus);

// Получить меню на сегодня
router.get('/today', authMiddleware, getTodayMenu);

// Получить меню по дате
router.get('/date/:date', authMiddleware, getDailyMenuByDate);

// Получить меню по ID
router.get('/:id', authMiddleware, getDailyMenuById);

// Создать меню
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), createDailyMenu);

// Обновить меню
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), updateDailyMenu);

// Удалить меню
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteDailyMenu);

// Подать приём пищи (списание продуктов)
router.post('/:id/serve/:mealType', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), serveMeal);

// Отменить подачу (вернуть продукты)
router.post('/:id/cancel/:mealType', authMiddleware, authorizeRole(['admin', 'manager']), cancelMeal);

// Добавить блюдо в приём пищи
router.post('/:id/meal/:mealType/dish', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), addDishToMeal);

// Удалить блюдо из приёма пищи
router.delete('/:id/meal/:mealType/dish/:dishId', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), removeDishFromMeal);

export default router;
