import { Request, Response, NextFunction } from 'express';
import { userService } from '../users/user.service';

export class UserController {
  // Создание нового пользователя
 async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);
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
      const userData = req.body;
      const user = await userService.updateUser(id, userData);
      
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
}

// Экземпляр контроллера для использования в маршрутах
export const userController = new UserController();