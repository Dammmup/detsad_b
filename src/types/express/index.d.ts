import { Request } from 'express';


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


export type { Request } from 'express';
