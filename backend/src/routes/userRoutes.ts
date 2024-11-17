import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getUserStats,
  updateProfile,
  updateProfileImage,
  updatePreferences,
  deleteAccount,
  updateProfilePassword
} from '../controllers/userController';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/custom';

const router = Router();

const authHandler = (handler: (req: AuthRequest, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthRequest, res);
    } catch (error) {
      next(error);
    }
  };
};

router.use(auth);

router.get('/stats', authHandler(getUserStats));
router.patch('/profile', authHandler(updateProfile));
router.post('/profile/image', authHandler(updateProfileImage));
router.patch('/preferences', authHandler(updatePreferences));
router.delete('/account', authHandler(deleteAccount));
router.patch('/profile/password', auth, authHandler(updateProfilePassword));

export default router;