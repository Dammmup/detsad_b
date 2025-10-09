import { Request, Response, NextFunction } from 'express';
import { IUser } from '../entities/users/model';

type UserRole = 'admin' | 'teacher' | 'student';

export const authorizeRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!roles.includes(user.role as UserRole)) {
      return res.status(403).json({ message: 'Недостаточно прав доступа' });
    }

    next();
  };
};
