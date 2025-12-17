import { Request, Response } from 'express';
import { AuthService } from './service';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

export const getCurrentUser = async (req: Request, res: Response) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен в заголовке Authorization' });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {

    const result = await authService.validateToken(token);

    if (result.valid && result.user) {
      res.json({
        id: result.user.id,
        fullName: result.user.fullName,
        role: result.user.role,
        active: result.user.active
      });
    } else {
      res.status(401).json({ error: 'Недействительный токен' });
    }
  } catch (error) {
    console.error('❌ Ошибка получения информации о пользователе:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' });
  }
};