import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendEmail } from '../services/emailService';

export interface AuthRequest extends Request {
  userId: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, securityAnswers } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !securityAnswers) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate security answers
    if (!Array.isArray(securityAnswers) || securityAnswers.length !== 3 || 
        securityAnswers.some(answer => !answer || typeof answer !== 'string')) {
      res.status(400).json({ error: 'Three security answers are required' });
      return;
    }

    console.log('Registration attempt:', { email, name, securityAnswersProvided: securityAnswers.length });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Hash security answers
    const hashedAnswers = await Promise.all(
      securityAnswers.map(answer => bcrypt.hash(answer.toLowerCase().trim(), salt))
    );

    const user = new User({
      email,
      password: hashedPassword,
      name,
      securityAnswers: hashedAnswers,
      preferences: {
        genres: []
      }
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' }
    );

    try {
      await sendEmail(email, 'welcome', { name });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: {
          genres: []
        }
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed, please try again' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login request received:', {
      email: req.body.email,
      hasPassword: !!req.body.password
    });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Login failed: User not found');
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      console.log('Login failed: Invalid password');
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '24h' }
    );

    console.log('Login successful, sending response');

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed, please try again' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    try {
      await sendEmail(email, 'passwordReset', { otp });
      res.json({ message: 'OTP sent to email' });
    } catch (emailErr) {
      // Rollback the OTP
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed' });
  }
};

export const verifySecurityAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, answers } = req.body;

    // Validate input
    if (!email || !answers || !Array.isArray(answers) || answers.length !== 3) {
      res.status(400).json({ error: 'Email and three security answers are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if the email exists
      res.status(400).json({ error: 'Invalid email or security answers' });
      return;
    }

    // Verify each answer
    const answersMatch = await Promise.all(
      answers.map(async (answer, index) => {
        if (!user.securityAnswers || !user.securityAnswers[index]) {
          return false;
        }
        return bcrypt.compare(
          answer.toLowerCase().trim(), 
          user.securityAnswers[index]
        );
      })
    );

    if (!answersMatch.every(match => match)) {
      res.status(400).json({ error: 'Invalid security answers' });
      return;
    }

    res.json({ message: 'Security answers verified successfully' });
  } catch (err) {
    console.error('Security answer verification error:', err);
    res.status(500).json({ error: 'Failed to verify security answers' });
  }
};

export const resetPasswordWithSecurityAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, answers, newPassword } = req.body;

    // Validate input
    if (!email || !answers || !newPassword || !Array.isArray(answers) || answers.length !== 3) {
      res.status(400).json({ error: 'Email, security answers, and new password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or security answers' });
      return;
    }

    // Verify security answers
    const answersMatch = await Promise.all(
      answers.map(async (answer, index) => {
        if (!user.securityAnswers || !user.securityAnswers[index]) {
          return false;
        }
        return bcrypt.compare(
          answer.toLowerCase().trim(),
          user.securityAnswers[index]
        );
      })
    );

    if (!answersMatch.every(match => match)) {
      res.status(400).json({ error: 'Invalid security answers' });
      return;
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const updateProfilePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
};