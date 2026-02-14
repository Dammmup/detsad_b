import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../entities/users/model';

export interface AuthUser {
  id: string;
  role: string;
  [key: string]: any;
  phone: string;
  fullName: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // Дебаг-логирование для диагностики мобильного приложения
  console.log('🔍 AuthMiddleware | Path:', req.path, '| Method:', req.method);
  console.log('🔍 AuthMiddleware | Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 AuthMiddleware | Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ AuthMiddleware | Токен не предоставлен или неверный формат');
    return res.status(401).json({ error: 'Токен не предоставлен в заголовке Authorization' });
  }

  const token = authHeader.substring(7);
  verifyToken(token, req, res, next);
}

async function verifyToken(token: string, req: Request, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET не установлен в переменных окружения!');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;

    // Проверяем, был ли уже отправлен ответ
    if (res.headersSent) {
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }

    res.locals.user = decoded;
    (req as any).user = decoded;
    console.log('✅ Пользователь аутентифицирован:', decoded.fullName, 'Роль:', decoded.role);
    next();
  } catch (err: any) {
    // Проверяем, был ли уже отправлен ответ
    if (res.headersSent) {
      return;
    }

    if (err.name === 'CastError') {
      // Ошибка при попытке преобразования ID
      console.error('❌ Ошибка проверки пользователя (неправильный формат ID):', err);
      return res.status(401).json({ error: 'Неверный идентификатор пользователя' });
    } else if (err.name === 'MongoError' || err.name === 'MongooseError' || err.name === 'MongoServerError') {
      // Ошибки базы данных (MongoDB/Mongoose)
      console.error('❌ Ошибка базы данных при проверке пользователя:', err.name, err.message);
      return res.status(500).json({ error: 'Ошибка сервера при проверке пользователя', details: err.name });
    }

    // Логируем любую другую ошибку для отладки
    console.error('❌ Неизвестная ошибка при проверке токена:', err.name, err.message, err);

    let errorMessage = 'Неверный токен';

    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Токен истёк';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Невалидный токен';
    }

    return res.status(401).json({ error: errorMessage });
  }
}
