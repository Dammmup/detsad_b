import express from 'express';
import {
    getAllDishes,
    getDishById,
    createDish,
    updateDish,
    deleteDish,
    getDishesByCategory,
    toggleDishActive,
    getDishCost,
    checkDishAvailability
} from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = express.Router();

// Получить все блюда
router.get('/', authMiddleware, getAllDishes);

// Блюда по категории
router.get('/category/:category', authMiddleware, getDishesByCategory);

// Получить блюдо по ID
router.get('/:id', authMiddleware, getDishById);

// Стоимость блюда
router.get('/:id/cost', authMiddleware, getDishCost);

// Проверка доступности ингредиентов
router.get('/:id/availability', authMiddleware, checkDishAvailability);

// Создать блюдо
router.post('/', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), createDish);

// Обновить блюдо
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), updateDish);

// Переключить активность
router.patch('/:id/toggle', authMiddleware, authorizeRole(['admin', 'manager', 'cook']), toggleDishActive);

// Удалить блюдо
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteDish);

export default router;
