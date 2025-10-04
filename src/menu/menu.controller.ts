import { Request, Response, NextFunction } from 'express';
import { menuService } from './menu.service';

export class MenuController {
  // === Menu Items ===
  
  // Получение списка пунктов меню
  async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isActive, search } = req.query;
      
      const filter: any = {};
      if (category) filter.category = category;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const menuItems = await menuService.getMenuItems(filter);
      res.json({ success: true, data: menuItems });
    } catch (error) {
      next(error);
    }
  }

  // Получение пункта меню по ID
  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const menuItem = await menuService.getMenuItemById(id);
      
      if (!menuItem) {
        return res.status(404).json({ success: false, message: 'Пункт меню не найден' });
      }
      
      res.json({ success: true, data: menuItem });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового пункта меню
  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const menuItem = await menuService.createMenuItem(req.body);
      res.status(201).json({ success: true, data: menuItem });
    } catch (error) {
      next(error);
    }
  }

  // Обновление пункта меню
  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await menuService.updateMenuItem(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Пункт меню не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление пункта меню
  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await menuService.deleteMenuItem(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Пункт меню не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Cyclograms ===
  
  // Получение списка циклограмм
  async getCyclograms(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, ageGroup, search } = req.query;
      
      const filter: any = {};
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (ageGroup) filter.ageGroup = ageGroup;
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const cyclograms = await menuService.getCyclograms(filter);
      res.json({ success: true, data: cyclograms });
    } catch (error) {
      next(error);
    }
  }

  // Получение циклограммы по ID
  async getCyclogramById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cyclogram = await menuService.getCyclogramById(id);
      
      if (!cyclogram) {
        return res.status(404).json({ success: false, message: 'Циклограмма не найдена' });
      }
      
      res.json({ success: true, data: cyclogram });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой циклограммы
  async createCyclogram(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const cyclogramData = {
        ...req.body,
        createdBy: user._id
      };
      
      const cyclogram = await menuService.createCyclogram(cyclogramData);
      res.status(201).json({ success: true, data: cyclogram });
    } catch (error) {
      next(error);
    }
  }

  // Обновление циклограммы
  async updateCyclogram(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await menuService.updateCyclogram(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Циклограмма не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление циклограммы
  async deleteCyclogram(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await menuService.deleteCyclogram(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Циклограмма не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // === Schedules ===
  
  // Получение списка расписаний
  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { cyclogramId, isPublished, date, startDate, endDate } = req.query;
      
      const filter: any = {};
      if (cyclogramId) filter.cyclogramId = cyclogramId;
      if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
      
      // Фильтр по дате
      if (date) {
        const dateObj = new Date(date as string);
        filter.date = {
          $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          $lte: new Date(dateObj.setHours(23, 59, 999))
        };
      }
      
      // Фильтр по периоду
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate as string);
        if (endDate) filter.date.$lte = new Date(endDate as string);
      }
      
      const schedules = await menuService.getSchedules(filter);
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  // Получение расписания по ID
  async getScheduleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schedule = await menuService.getScheduleById(id);
      
      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Расписание не найдено' });
      }
      
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового расписания
  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await menuService.createSchedule(req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  // Обновление расписания
  async updateSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await menuService.updateSchedule(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Расписание не найдено' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление расписания
  async deleteSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await menuService.deleteSchedule(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Расписание не найдено' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение расписаний по дате
  async getSchedulesByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.params;
      const schedules = await menuService.getSchedulesByDate(new Date(date));
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  // Получение расписаний по периоду
  async getSchedulesByPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Необходимо указать startDate и endDate' });
      }
      
      const schedules = await menuService.getSchedulesByPeriod(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  // Получение расписаний по циклограмме
  async getSchedulesByCyclogramId(req: Request, res: Response, next: NextFunction) {
    try {
      const { cyclogramId } = req.params;
      const schedules = await menuService.getSchedulesByCyclogramId(cyclogramId);
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  // Публикация расписания
  async publishSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const published = await menuService.publishSchedule(id, user._id);
      
      if (!published) {
        return res.status(404).json({ success: false, message: 'Расписание не найдено' });
      }
      
      res.json({ success: true, data: published });
    } catch (error) {
      next(error);
    }
  }

  // Снятие с публикации расписания
  async unpublishSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const unpublished = await menuService.unpublishSchedule(id);
      
      if (!unpublished) {
        return res.status(404).json({ success: false, message: 'Расписание не найдено' });
      }
      
      res.json({ success: true, data: unpublished });
    } catch (error) {
      next(error);
    }
  }

  // === Menu Statistics ===
  
  // Получение статистики меню
  async getMenuStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await menuService.getMenuStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // === Search ===
  
  // Поиск пунктов меню по названию
  async searchMenuItemsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const menuItems = await menuService.searchMenuItemsByName(term as string);
      res.json({ success: true, data: menuItems });
    } catch (error) {
      next(error);
    }
  }

  // Поиск циклограмм по названию
  async searchCyclogramsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const cyclograms = await menuService.searchCyclogramsByName(term as string);
      res.json({ success: true, data: cyclograms });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const menuController = new MenuController();