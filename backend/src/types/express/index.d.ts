import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export interface AuthRequest extends Request {
  userId: string;
}