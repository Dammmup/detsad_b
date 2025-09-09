import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';



export interface AuthUser {
  id: string;
  role: string;
  [key: string]: any;
  phone: string;
  fullName: string;
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Нет токена авторизации' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Неверный формат токена' });
  }
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET не установлен в переменных окружения!');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }
  
  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.user = decoded;
    next();
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
