import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../entities/users/model'; // Импортируем модель User для проверки существования пользователя
import { AuthUser } from './authMiddleware';

/**
 * Simple JWT authentication middleware. Gets the token from Authorization header
 * and verifies it. Adds the decoded payload to `req.user`.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Извлекаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token in Authorization header' });
  }
  
  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthUser;
    
    // Проверяем, что пользователь все еще существует в базе данных
    const userModel = User();
    userModel.findById(decoded.id).then(user => {
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
      }
      
      (req as any).user = decoded;
      return next();
    }).catch(err => {
      console.error('❌ Ошибка проверки пользователя:', err);
      return res.status(500).json({ error: 'Ошибка сервера при проверке пользователя' });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
