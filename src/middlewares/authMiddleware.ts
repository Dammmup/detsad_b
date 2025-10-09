import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../entities/users/model'; // Импортируем модель User для проверки существования пользователя


export interface AuthUser {
  id: string;
  role: string;
  [key: string]: any;
 phone: string;
 fullName: string;
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Извлекаем токен из cookie
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен в cookie' });
 }
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET не установлен в переменных окружения!');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }
  
  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    
    // Проверяем, что пользователь все еще существует в базе данных
    User.findById(decoded.id).then(user => {
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
      }
      
      req.user = decoded;
      next();
    }).catch(err => {
      console.error('❌ Ошибка проверки пользователя:', err);
      return res.status(500).json({ error: 'Ошибка сервера при проверке пользователя' });
    });
  } catch (err: any) {
    let errorMessage = 'Неверный токен';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Токен истёк';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Невалидный токен';
    }
    
    return res.status(401).json({ error: errorMessage });
  }
}
