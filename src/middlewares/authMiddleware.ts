import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getModel } from '../config/modelRegistry';

export interface AuthUser {
  id: string;
  role: string;
  [key: string]: any;
 phone: string;
 fullName: string;
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Извлекаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
 if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен в заголовке Authorization' });
  }
  
  const token = authHeader.substring(7);
  verifyToken(token, req, res, next);
}

function verifyToken(token: string, req: Request, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET не установлен в переменных окружения!');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }
  
  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    
    // Проверяем, что пользователь все еще существует в базе данных
    const User = getModel<any>('User');
    User.findById(decoded.id).then(user => {
      if (!user || !user.active) {
        return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
      }
      
      res.locals.user = decoded; // Сохраняем пользователя в res.locals для дальнейшего использования
      (req as any).user = decoded; // Также сохраняем в req.user для совместимости
      console.log('✅ Пользователь аутентифицирован:', decoded.fullName, 'Роль:', decoded.role);
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
