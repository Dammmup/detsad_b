import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authorizeRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      // Добавляем user в req для дальнейшего использования
      (req as any).user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
