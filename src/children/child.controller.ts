import { Request, Response, NextFunction } from 'express';
import { childService } from './child.service';

export class ChildController {
  // Получение списка детей
  async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, parentId, ageGroup, active, search } = req.query;
      
      const filter: any = {};
      if (groupId) filter.groupId = groupId;
      if (ageGroup) filter.ageGroup = ageGroup;
      if (active !== undefined) filter.active = active === 'true';
      if (search) {
        filter.fullName = { $regex: search, $options: 'i' };
      }
      
      const children = await childService.getChildren(filter);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  // Получение ребенка по ID
  async getChildById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const child = await childService.getChildById(id);
      
      if (!child) {
        return res.status(404).json({ success: false, message: 'Ребенок не найден' });
      }
      
      res.json({ success: true, data: child });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового ребенка
  async createChild(req: Request, res: Response, next: NextFunction) {
    try {
      const child = await childService.createChild(req.body);
      res.status(201).json({ success: true, data: child });
    } catch (error) {
      next(error);
    }
  }

  // Обновление ребенка
  async updateChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await childService.updateChild(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Ребенок не найден' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление ребенка
  async deleteChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await childService.deleteChild(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Ребенок не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение детей по группе
  async getChildrenByGroupId(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const children = await childService.getChildrenByGroupId(groupId);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  // Получение детей по родителю
  async getChildrenByParentId(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentId } = req.params;
      const children = await childService.getChildrenByParentId(parentId);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  // Получение детей по возрастной группе
  async getChildrenByAgeGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { ageGroup } = req.params;
      const children = await childService.getChildrenByAgeGroup(ageGroup);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  // Получение статистики по детям
  async getChildrenStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await childService.getChildrenStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Поиск детей по имени
  async searchChildrenByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const children = await childService.searchChildrenByName(term as string);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const childController = new ChildController();