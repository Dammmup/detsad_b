import { Request, Response } from 'express';
import { dishesService } from './service';

export const getAllDishes = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { category, isActive, createdBy } = req.query;

        const dishes = await dishesService.getAll({
            category: category as string,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            createdBy: createdBy as string
        });

        res.json(dishes);
    } catch (err) {
        console.error('Error fetching dishes:', err);
        res.status(500).json({ error: 'Ошибка получения блюд' });
    }
};

export const getDishById = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const dish = await dishesService.getById(req.params.id);
        res.json(dish);
    } catch (err: any) {
        console.error('Error fetching dish:', err);
        res.status(404).json({ error: err.message || 'Блюдо не найдено' });
    }
};

export const createDish = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const dishData = {
            ...req.body,
            createdBy: req.user.id
        };

        const dish = await dishesService.create(dishData);
        res.status(201).json(dish);
    } catch (err: any) {
        console.error('Error creating dish:', err);
        res.status(400).json({ error: err.message || 'Ошибка создания блюда' });
    }
};

export const updateDish = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const dish = await dishesService.update(req.params.id, req.body);
        res.json(dish);
    } catch (err: any) {
        console.error('Error updating dish:', err);
        res.status(404).json({ error: err.message || 'Ошибка обновления блюда' });
    }
};

export const deleteDish = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const result = await dishesService.delete(req.params.id);
        res.json(result);
    } catch (err: any) {
        console.error('Error deleting dish:', err);
        res.status(404).json({ error: err.message || 'Ошибка удаления блюда' });
    }
};

export const getDishesByCategory = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { category } = req.params;
        const dishes = await dishesService.getByCategory(category);
        res.json(dishes);
    } catch (err: any) {
        console.error('Error fetching dishes by category:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения блюд' });
    }
};

export const toggleDishActive = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const dish = await dishesService.toggleActive(req.params.id);
        res.json(dish);
    } catch (err: any) {
        console.error('Error toggling dish active:', err);
        res.status(404).json({ error: err.message || 'Ошибка изменения статуса блюда' });
    }
};

export const getDishCost = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const cost = await dishesService.calculateCost(req.params.id);
        res.json({ cost });
    } catch (err: any) {
        console.error('Error calculating dish cost:', err);
        res.status(404).json({ error: err.message || 'Ошибка расчета стоимости' });
    }
};

export const checkDishAvailability = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const servings = req.query.servings ? parseInt(req.query.servings as string) : 1;
        const availability = await dishesService.checkAvailability(req.params.id, servings);
        res.json(availability);
    } catch (err: any) {
        console.error('Error checking dish availability:', err);
        res.status(404).json({ error: err.message || 'Ошибка проверки доступности' });
    }
};
