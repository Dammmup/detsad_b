import { Request, Response } from 'express';
import { AuthService } from './service';
import { sendLogToTelegram } from '../../utils/telegramLogger';
import { getModel } from '../../config/modelRegistry';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  console.log('login:', phone, password);
  try {
    const result = await authService.login(phone, password);
    const User = getModel<any>('User');
    const user = await User.findOne({ phone: phone });
    if (user) {
      await sendLogToTelegram(`Пользователь ${user.fullName} вошёл в систему`);
    } else {
      await sendLogToTelegram(`Пользователь с телефоном ${phone} вошёл в систему`);
    }
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
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
    await sendLogToTelegram('Пользователь вышел из системы');
    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка при выходе из системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};