import { Request } from 'express';

export interface AuthUser {
  id: string;
  role: string;
  phone: string;
  fullName: string;
  groupId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
