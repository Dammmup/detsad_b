import { Request } from 'express';

// Определяем упрощенный тип пользователя для аутентификации
export interface AuthUser {
  id: string;
  role: string;
  phone: string;
  fullName: string;
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

// Экспортируем Request для использования в контроллерах
export type { Request } from 'express';
