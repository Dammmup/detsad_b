import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

export class UserController {
  // Создание нового пользователя
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      let userData = req.body;
      
      // Удалим поля, которые не используются на бэкенде, но могут приходить с фронтенда
      const { fines, isVerified, avatarUrl, permissions, username, parentPhone, parentName, ...createData } = userData;
      
      const user = await userService.createUser(createData);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  // Получение пользователя по ID
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  // Получение списка пользователей
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, role, active, groupId } = req.query;
      
      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        role: role as string,
        active: active === undefined ? undefined : active === 'true',
        groupId: groupId as string,
      };
      
      const result = await userService.getUsers(options);
      res.json(result);
    } catch (error) {
      next(error);
    }
 }

  // Обновление пользователя
 async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      let userData = req.body;
      
      // Убедимся, что поля, не поддерживаемые бэкендом, не вызывают ошибок
      // Удалим поля, которые не используются на бэкенде, но могут приходить с фронтенда
      const { fines, isVerified, avatarUrl, permissions, username, parentPhone, parentName, ...updateData } = userData;
      
      const user = await userService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  // Удаление пользователя
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Активация/деактивация пользователя
  async toggleUserActiveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const user = await userService.toggleUserActiveStatus(id, active);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
  
  // Обновление настроек зарплаты и штрафов
  async updatePayrollSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      let payrollData = req.body;
      
      // Удалим поля, которые не используются в настройках зарплаты
      const { fines, isVerified, avatarUrl, permissions, username, parentPhone, parentName, ...payrollUpdateData } = payrollData;
      
      const user = await userService.updatePayrollSettings(id, payrollUpdateData);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

// Экземпляр контроллера для использования в маршрутах
export const userController = new UserController();