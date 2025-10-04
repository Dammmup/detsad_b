import { Request, Response, NextFunction } from 'express';
import { settingService } from './setting.service';

export class SettingController {
  // Получение списка настроек
 async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isPublic } = req.query;
      
      const filter: any = {};
      if (category) filter.category = category;
      if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
      
      const settings = await settingService.getSettings(filter);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  // Получение настройки по ключу
  async getSettingByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const setting = await settingService.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ success: false, message: 'Настройка не найдена' });
      }
      
      res.json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }

  // Установка настройки
  async setSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value, type, category, description } = req.body;
      
      if (!type || !category) {
        return res.status(400).json({ success: false, message: 'Тип и категория обязательны' });
      }
      
      const setting = await settingService.setSetting(key, value, type, category, description);
      res.json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }

  // Удаление настройки
  async deleteSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const deleted = await settingService.deleteSetting(key);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Настройка не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение настроек по категории
  async getSettingsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const settings = await settingService.getSettingsByCategory(category);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  // Получение публичных настроек
  async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getPublicSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const settingController = new SettingController();