import { Request, Response } from 'express';
import { AuthService } from './service';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  console.log('login:', phone, password);
  try {
    const result = await authService.login(phone, password);
    // Установка токена в httpOnly cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Устанавливаем secure в true для production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Используем 'none' для production (междоменный доступ), 'lax' для разработки
      maxAge: 24 * 60 * 60 * 1000 // 24 часа в миллисекундах
    });
    
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  const token = req.cookies.auth_token; // Получаем токен из cookie
  
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
    
    // Удаляем токен из cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка при выходе из системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};