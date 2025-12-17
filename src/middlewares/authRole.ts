import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authorizeRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('[AUTH] Checking authorization for roles:', roles);


    const user = (req as any).user;
    if (!user) {
      console.log('[AUTH] No user found in request - authMiddleware not called');
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log('[AUTH] User found:', {
      id: user.id,
      role: user.role,
      fullName: user.fullName
    });

    if (!roles.includes(user.role)) {
      console.log('[AUTH] User role not authorized. Required:', roles, 'Actual:', user.role);
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('[AUTH] Authorization successful for user:', user.fullName);
    next();
  };
}
