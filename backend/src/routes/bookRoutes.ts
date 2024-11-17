import { Router } from 'express';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types/custom';
import { Request, Response, NextFunction } from 'express';
import {
  createBook,
  getBooks,
  getUserBooks,
  updateBook,
  deleteBook
} from '../controllers/bookController';

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

// Public routes
router.get('/', getBooks);

// Protected routes
router.use(auth);
router.post('/', authHandler(createBook));
router.get('/user', authHandler(getUserBooks));  // Add this route for user's books
router.patch('/:id', authHandler(updateBook));
router.delete('/:id', authHandler(deleteBook));

export default router;