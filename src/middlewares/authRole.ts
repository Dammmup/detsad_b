import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authorizeRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('[AUTH] Checking authorization for roles:', roles);
    console.log('[AUTH] Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[AUTH] No authorization header found');
      return res.status(401).json({ error: 'No token' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[AUTH] Token found, length:', token.length);
    console.log('[AUTH] Token start:', token.substring(0, 20));
    console.log('[AUTH] JWT_SECRET length:', (process.env.JWT_SECRET || 'secret').length);
    
    try {
      console.log('[AUTH] Attempting to verify token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      console.log('[AUTH] Token verified, decoded payload:', { 
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        username: decoded.username
      });
      
      if (!roles.includes(decoded.role)) {
        console.log('[AUTH] User role not authorized. Required:', roles, 'Actual:', decoded.role);
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Добавляем user в req для дальнейшего использования
      (req as any).user = decoded;
      console.log('[AUTH] Authorization successful for user:', decoded.username);
      next();
    } catch (err) {
      console.error('[AUTH] Token verification failed:', err);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
