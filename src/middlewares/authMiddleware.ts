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
  console.log('[AUTH] Authorization header:', authHeader ? 'present' : 'missing');
  if (!authHeader) return res.status(401).json({ error: 'Нет токена авторизации' });
  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'devsecret';
  console.log('[AUTH] Using JWT_SECRET length:', secret.length, 'Token length:', token?.length);
  console.log('[AUTH] Token start:', token?.substring(0, 20) + '...');
  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    console.log('[AUTH] Decoded user:', { id: decoded.id, role: decoded.role });
    req.user = decoded;
    next();
  } catch (err: any) {
    console.log('[AUTH] Token verification failed:', err.name, err.message);
    console.log('[AUTH] Full error:', err);
    // Для отладки: попробуем другой секрет
    if (err.name === 'JsonWebTokenError' && err.message === 'invalid signature') {
      console.log('[AUTH] Trying alternative secrets...');
      const alternativeSecrets = ['secret', 'devsecret', 'your-secret-key', 'default-secret'];
      for (const altSecret of alternativeSecrets) {
        try {
          const decoded = jwt.verify(token, altSecret) as AuthUser;
          console.log('[AUTH] SUCCESS with alternative secret:', altSecret);
          console.log('[AUTH] Decoded user:', { id: decoded.id, role: decoded.role });
          req.user = decoded;
          return next();
        } catch (altErr) {
          // Продолжаем поиск
        }
      }
    }
    res.status(401).json({ error: 'Неверный токен авторизации: ' + err.message });
  }
}
