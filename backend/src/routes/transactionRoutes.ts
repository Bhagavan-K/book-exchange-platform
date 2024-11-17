import { Router } from 'express';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types/custom';
import { Request, Response, NextFunction } from 'express';
import {
  createExchangeRequest,
  updateExchangeStatus,
  getSentRequests,
  getReceivedRequests,
  getUserExchanges,
  getExchangeDetails,
  getUnreadCount,
  addMessage
} from '../controllers/transactionController';

const router = Router();

// Middleware to handle type casting
const authHandler = (handler: (req: AuthRequest, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

// Apply auth middleware to all routes
router.use(auth);

// Exchange request routes
router.post('/request', authHandler(createExchangeRequest));
router.patch('/:requestId/status', authHandler(updateExchangeStatus));
router.post('/:exchangeId/messages', addMessage);

// Request listing routes
router.get('/sent', authHandler(getSentRequests));
router.get('/received', authHandler(getReceivedRequests));
router.get('/user', authHandler(getUserExchanges));
router.get('/:exchangeId', authHandler(getExchangeDetails));
router.get('/notifications/unread', authHandler(getUnreadCount));

export default router;