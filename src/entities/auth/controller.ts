import { Request, Response } from 'express';
import { AuthService } from './service';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  console.log('login:', phone, password);
  try {
    const result = await authService.login(phone, password);
    
    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  // Получаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
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
    
    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('❌ Ошибка при выходе из системы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};