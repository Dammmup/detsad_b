import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../entities/users/model';
import { AuthUser } from '../types/express';
export type { AuthUser } from '../types/express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    if (res.headersSent) {
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Пользователь не найден или неактивен' });
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (res.headersSent) {
      return;
    }

    if (err.name === 'CastError') {
      console.error('❌ Ошибка проверки пользователя (неправильный формат ID):', err);
      return res.status(401).json({ error: 'Неверный идентификатор пользователя' });
    } else if (err.name === 'MongoError' || err.name === 'MongooseError' || err.name === 'MongoServerError') {
      console.error('❌ Ошибка базы данных при проверке пользователя:', err.name, err.message);
      return res.status(500).json({ error: 'Ошибка сервера при проверке пользователя' });
    }

    let errorMessage = 'Неверный токен';

    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Токен истёк';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Невалидный токен';
    }

    return res.status(401).json({ error: errorMessage });
  }
}
