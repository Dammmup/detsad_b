import { Request, Response, NextFunction } from 'express';
import { groupService } from './group.service';

export class GroupController {
  // Получение списка групп
  async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId, active, search } = req.query;
      
      const filter: any = {};
      if (teacherId) filter.teacherId = teacherId;
      if (active !== undefined) filter.active = active === 'true';
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      const groups = await groupService.getGroups(filter);
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  // Получение группы по ID
  async getGroupById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupById(id);
      
      if (!group) {
        return res.status(404).json({ success: false, message: 'Группа не найдена' });
      }
      
      res.json({ success: true, data: group });
    } catch (error) {
      next(error);
    }
  }

  // Создание новой группы
  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupService.createGroup(req.body);
      res.status(201).json({ success: true, data: group });
    } catch (error) {
      next(error);
    }
  }

  // Обновление группы
  async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await groupService.updateGroup(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Группа не найдена' });
      }
      
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Удаление группы
  async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await groupService.deleteGroup(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Группа не найдена' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // Получение групп по воспитателю
  async getGroupsByTeacherId(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const groups = await groupService.getGroupsByTeacherId(teacherId);
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  // Получение активных групп
  async getActiveGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await groupService.getActiveGroups();
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  // Получение детей в группе
  async getChildrenInGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const children = await groupService.getChildrenInGroup(groupId);
      res.json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }

  // Получение статистики групп
  async getGroupStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await groupService.getGroupStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Поиск групп по названию
  async searchGroupsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.query;
      if (!term) {
        return res.status(400).json({ success: false, message: 'Необходимо указать поисковый термин' });
      }
      
      const groups = await groupService.searchGroupsByName(term as string);
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const groupController = new GroupController();