import { Router } from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  verifySecurityAnswers,
  resetPasswordWithSecurityAnswers 
} from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-security-answers', verifySecurityAnswers);
router.post('/reset-password-security', resetPasswordWithSecurityAnswers);

export default router;