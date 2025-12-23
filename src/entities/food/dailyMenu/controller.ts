import { Request, Response } from 'express';
import { dailyMenuService } from './service';

export const getAllDailyMenus = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { startDate, endDate } = req.query;

        const menus = await dailyMenuService.getAll({
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined
        });

        res.json(menus);
    } catch (err) {
        console.error('Error fetching daily menus:', err);
        res.status(500).json({ error: 'Ошибка получения меню' });
    }
};

export const getDailyMenuById = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const menu = await dailyMenuService.getById(req.params.id);
        res.json(menu);
    } catch (err: any) {
        console.error('Error fetching daily menu:', err);
        res.status(404).json({ error: err.message || 'Меню не найдено' });
    }
};

export const getDailyMenuByDate = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { date } = req.params;
        const menu = await dailyMenuService.getByDate(new Date(date));

        if (!menu) {
            return res.status(404).json({ error: 'Меню на эту дату не найдено' });
        }

        res.json(menu);
    } catch (err: any) {
        console.error('Error fetching daily menu by date:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения меню' });
    }
};

export const getTodayMenu = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const menu = await dailyMenuService.getTodayMenu();

        if (!menu) {
            return res.json(null); // Меню на сегодня нет
        }

        res.json(menu);
    } catch (err: any) {
        console.error('Error fetching today menu:', err);
        res.status(500).json({ error: err.message || 'Ошибка получения меню' });
    }
};

export const createDailyMenu = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const menuData = {
            ...req.body,
            createdBy: req.user.id
        };

        const menu = await dailyMenuService.create(menuData);
        res.status(201).json(menu);
    } catch (err: any) {
        console.error('Error creating daily menu:', err);
        res.status(400).json({ error: err.message || 'Ошибка создания меню' });
    }
};

export const updateDailyMenu = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const menu = await dailyMenuService.update(req.params.id, req.body);
        res.json(menu);
    } catch (err: any) {
        console.error('Error updating daily menu:', err);
        res.status(404).json({ error: err.message || 'Ошибка обновления меню' });
    }
};

export const deleteDailyMenu = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const result = await dailyMenuService.delete(req.params.id);
        res.json(result);
    } catch (err: any) {
        console.error('Error deleting daily menu:', err);
        res.status(404).json({ error: err.message || 'Ошибка удаления меню' });
    }
};

export const serveMeal = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { id, mealType } = req.params;
        const { childCount } = req.body;

        if (!childCount || childCount <= 0) {
            return res.status(400).json({ error: 'Количество детей должно быть положительным числом' });
        }

        const menu = await dailyMenuService.serveMeal(
            id,
            mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            childCount
        );
        res.json(menu);
    } catch (err: any) {
        console.error('Error serving meal:', err);
        res.status(400).json({ error: err.message || 'Ошибка подачи приёма пищи' });
    }
};

export const cancelMeal = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { id, mealType } = req.params;

        const menu = await dailyMenuService.cancelMeal(
            id,
            mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'
        );
        res.json(menu);
    } catch (err: any) {
        console.error('Error canceling meal:', err);
        res.status(400).json({ error: err.message || 'Ошибка отмены подачи' });
    }
};

export const addDishToMeal = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { id, mealType } = req.params;
        const { dishId } = req.body;

        if (!dishId) {
            return res.status(400).json({ error: 'ID блюда обязателен' });
        }

        const menu = await dailyMenuService.addDishToMeal(
            id,
            mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            dishId
        );
        res.json(menu);
    } catch (err: any) {
        console.error('Error adding dish to meal:', err);
        res.status(400).json({ error: err.message || 'Ошибка добавления блюда' });
    }
};

export const removeDishFromMeal = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const { id, mealType, dishId } = req.params;

        const menu = await dailyMenuService.removeDishFromMeal(
            id,
            mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            dishId
        );
        res.json(menu);
    } catch (err: any) {
        console.error('Error removing dish from meal:', err);
        res.status(400).json({ error: err.message || 'Ошибка удаления блюда' });
    }
};
