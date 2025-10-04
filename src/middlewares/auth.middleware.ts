import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../users/user.model';

// Middleware для аутентификации пользователя
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('🔍 Auth middleware проверка токена:', token);
    
    // Проверяем, есть ли токен
    if (!token) {
      console.log('❌ Токен отсутствует');
      return res.status(401).json({ 
        success: false, 
        message: 'Токен аутентификации отсутствует' 
      });
    }
    
    // Проверяем валидность токена
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    console.log('🔍 Декодированный токен:', decoded);
    
    // Проверяем, не истек ли токен
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.log('❌ Токен истек');
      return res.status(401).json({ 
        success: false, 
        message: 'Токен аутентификации истек' 
      });
    }
    
    // Получаем пользователя из базы данных
    const user = await User.findById(decoded.userId);
    console.log('🔍 Найден пользователь:', user?._id);
    
    // Проверяем, существует ли пользователь
    if (!user) {
      console.log('❌ Пользователь не найден');
      return res.status(401).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Проверяем, активен ли пользователь
    if (!user.active) {
      console.log('❌ Пользователь неактивен');
      return res.status(401).json({ 
        success: false, 
        message: 'Пользователь деактивирован' 
      });
    }
    
    // Добавляем пользователя в объект запроса
    req.user = user;
    console.log('✅ Аутентификация успешна');
    
    next();
  } catch (error) {
    console.error('❌ Ошибка аутентификации:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Неверный токен аутентификации' 
    });
  }
};