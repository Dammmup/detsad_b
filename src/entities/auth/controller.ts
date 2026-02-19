import { Request, Response } from 'express';
import User from '../users/model';
import { AuthService } from './service';
import { sendLogToTelegram } from '../../utils/telegramLogger';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  try {
    const result = await authService.login(phone, password);

    // Логирование в Telegram (не блокирует логин при ошибке)
    try {
      if (result.user) {
        await sendLogToTelegram(`Пользователь ${result.user.fullName} вошёл в систему`);
      } else {
        await sendLogToTelegram(`Пользователь с телефоном ${phone} вошёл в систему`);
      }
    } catch (telegramError) {
      console.warn('Telegram log failed:', telegramError);
    }

    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    const isAuthError = message.includes('Неверный') || message.includes('не найден') || message.includes('Invalid') || message.includes('not found');
    res.status(isAuthError ? 401 : 500).json({ error: message });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const result = await authService.validateToken(token);
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка валидации токена:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Недействительный токен' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    console.log('👋 Пользователь вышел из системы');

    // Логирование в Telegram (не блокирует логаут при ошибке)
    try {
      await sendLogToTelegram('Пользователь вышел из системы');
    } catch (telegramError) {
      console.warn('Telegram log failed:', telegramError);
    }

    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка при выходе из системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};