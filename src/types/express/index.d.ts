import { Request } from 'express';

// Определяем упрощенный тип пользователя для аутентификации
export interface AuthUser {
  _id: string;
  id?: string; // Для совместимости
  role: string;
  phone: string;
  fullName: string;
  active: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | undefined;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
