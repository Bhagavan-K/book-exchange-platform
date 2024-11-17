import { Request } from 'express';

export interface AuthRequest extends Request {
  userId: string;
}

export interface TokenPayload {
  userId: string;
}