import { Request, Response } from 'express';
import { MenuItemsService } from './service';

const menuItemsService = new MenuItemsService();

export const getAllMenuItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { category, dayOfWeek, weekNumber, isAvailable, createdBy } = req.query;
    
    const menuItems = await menuItemsService.getAll({
      category: category as string,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek as string) : undefined,
      weekNumber: weekNumber !== undefined ? parseInt(weekNumber as string) : undefined,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true') : undefined,
      createdBy: createdBy as string
    });
    
    res.json(menuItems);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Ошибка получения пунктов меню' });
  }
};

export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const menuItem = await menuItemsService.getById(req.params.id);
    res.json(menuItem);
  } catch (err: any) {
    console.error('Error fetching menu item:', err);
    res.status(404).json({ error: err.message || 'Пункт меню не найден' });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Добавляем создателя из аутентифицированного пользователя
    const menuItemData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const menuItem = await menuItemsService.create(menuItemData);
    res.status(201).json(menuItem);
  } catch (err: any) {
    console.error('Error creating menu item:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания пункта меню' });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const menuItem = await menuItemsService.update(req.params.id, req.body);
    res.json(menuItem);
  } catch (err: any) {
    console.error('Error updating menu item:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления пункта меню' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await menuItemsService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting menu item:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления пункта меню' });
  }
};

export const getMenuItemsByCategoryAndDay = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { category } = req.params;
    const { dayOfWeek, weekNumber } = req.query;
    
    if (dayOfWeek === undefined) {
      return res.status(400).json({ error: 'Не указан день недели' });
    }
    
    const menuItems = await menuItemsService.getByCategoryAndDay(
      category,
      parseInt(dayOfWeek as string),
      weekNumber !== undefined ? parseInt(weekNumber as string) : undefined
    );
    
    res.json(menuItems);
  } catch (err: any) {
    console.error('Error fetching menu items by category and day:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения пунктов меню по категории и дню' });
  }
};

export const getWeeklyMenu = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { weekNumber } = req.query;
    
    if (weekNumber === undefined) {
      return res.status(400).json({ error: 'Не указан номер недели' });
    }
    
    const weeklyMenu = await menuItemsService.getWeeklyMenu(parseInt(weekNumber as string));
    res.json(weeklyMenu);
  } catch (err: any) {
    console.error('Error fetching weekly menu:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения недельного меню' });
  }
};

export const toggleMenuItemAvailability = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const menuItem = await menuItemsService.toggleAvailability(req.params.id);
    res.json(menuItem);
  } catch (err: any) {
    console.error('Error toggling menu item availability:', err);
    res.status(404).json({ error: err.message || 'Ошибка изменения доступности пункта меню' });
  }
};

export const searchMenuItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { q, category } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Не указан поисковый запрос' });
    }
    
    const menuItems = await menuItemsService.searchByName(q as string, category as string);
    res.json(menuItems);
  } catch (err: any) {
    console.error('Error searching menu items:', err);
    res.status(500).json({ error: err.message || 'Ошибка поиска пунктов меню' });
  }
};

export const getMenuItemsByAllergen = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { allergen } = req.params;
    
    const menuItems = await menuItemsService.getByAllergen(allergen);
    res.json(menuItems);
  } catch (err: any) {
    console.error('Error fetching menu items by allergen:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения пунктов меню по аллергену' });
  }
};

export const getMenuNutritionalStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await menuItemsService.getNutritionalStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching menu nutritional statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики питания' });
  }
};