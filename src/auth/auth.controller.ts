import { Request, Response } from 'express';
import AuthService from './auth.service';
import User from '../users/user.model';

class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, phone, password, role } = req.body;

      // Валидация входных данных
      if (!username || !phone || !password) {
        res.status(400).json({ message: 'Все поля (username, phone, password) обязательны для заполнения' });
        return;
      }

      const result = await AuthService.register({ username, phone, password, role });
      
      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: result.user._id,
          fullName: result.user.fullName,
          role: result.user.role
        },
        token: result.token
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { phone, passwordHash } = req.body;

      // Валидация входных данных - теперь принимаем только phone и password
      if (!phone || !passwordHash) {
        res.status(400).json({ message: 'Телефон и пароль обязательны для заполнения' });
        return;
      }

      const result = await AuthService.login(phone, passwordHash);
      
      res.status(200).json({
        message: 'Успешный вход',
        user: {
          id: result.user._id,
          fullName: result.user.fullName,
          role: result.user.role
        },
        token: result.token
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id; // Получаем userId из middleware аутентификации
      
      const user = await AuthService.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: 'Пользователь не найден' });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id,
          fullName: user.fullName,
          role: user.role,
          active: user.active
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id; // Получаем userId из middleware аутентификации
      const profileData = req.body;

      // Удаляем поля, которые нельзя обновить через этот метод
      delete profileData.password;
      delete profileData.role;
      delete profileData.isActive;

      const updatedUser = await AuthService.updateProfile(userId, profileData);
      
      res.status(200).json({
        message: 'Профиль успешно обновлен',
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          active: updatedUser.active
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id; // Получаем userId из middleware аутентификации
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({ message: 'Старый и новый пароли обязательны для заполнения' });
        return;
      }

      const success = await AuthService.changePassword(userId, oldPassword, newPassword);
      
      if (success) {
        res.status(200).json({ message: 'Пароль успешно изменен' });
      } else {
        res.status(400).json({ message: 'Не удалось изменить пароль' });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Только для администраторов
      const currentUser = (req as any).user;
      const currentUserRole = currentUser.role;
      if (currentUserRole !== 'admin') {
        res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        return;
      }

      const users = await User.find({}, { password: 0 }); // Исключаем пароль из ответа
      
      res.status(200).json({
        users: users.map(user => ({
          id: user._id,
          fullName: user.fullName,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }

  public async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      // Только для администраторов
      const currentUserRole = (req as any).user.role;
      if (currentUserRole !== 'admin') {
        res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
        return;
      }

      const { userId, isActive } = req.body;

      if (!userId) {
        res.status(400).json({ message: 'ID пользователя обязателен' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'Пользователь не найден' });
        return;
      }

      user.active = isActive;
      await user.save();

      res.status(200).json({
        message: `Статус пользователя ${isActive ? 'активирован' : 'деактивирован'}`,
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          active: user.active
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
      }
    }
  }
}

export default new AuthController();
