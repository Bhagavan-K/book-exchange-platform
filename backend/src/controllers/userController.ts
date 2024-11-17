import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import Book from '../models/Book';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../types/custom';
import mongoose from 'mongoose';


// Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type');
      return cb(error as any, false);
    }
    cb(null, true);
  }
}).single('profileImage');

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalBooks,
      activeExchanges,
      completedExchanges,
      userWithReputation
    ] = await Promise.all([
      Book.countDocuments({ owner: new mongoose.Types.ObjectId(req.userId) }),
      Transaction.countDocuments({
        $or: [
          { requester: new mongoose.Types.ObjectId(req.userId) },
          { owner: new mongoose.Types.ObjectId(req.userId) }
        ],
        status: { $in: ['pending', 'accepted'] }
      }),
      Transaction.countDocuments({
        $or: [
          { requester: new mongoose.Types.ObjectId(req.userId) },
          { owner: new mongoose.Types.ObjectId(req.userId) }
        ],
        status: 'completed'
      }),
      User.findById(req.userId, 'reputation')
    ]);

    if (!userWithReputation) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      data: {
        totalBooks,
        activeExchanges,
        completedExchanges,
        reputation: userWithReputation.reputation || 0
      }
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
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

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bio, location, preferences } = req.body;
    console.log('Updating profile:', { name, bio, location, preferences });

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update user fields
    const updates: any = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (preferences) {
      updates.preferences = {
        genres: Array.isArray(preferences.genres) ? preferences.genres : []
      };
    }

    console.log('Applying updates:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -securityAnswers');

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found after update' });
      return;
    }

    // Return updated user data with proper formatting
    const userData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio || '',
      location: updatedUser.location || '',
      profileImage: updatedUser.profileImage,
      preferences: {
        genres: updatedUser.preferences?.genres || []
      },
      reputation: updatedUser.reputation || 0,
      createdAt: updatedUser.createdAt
    };

    console.log('Profile updated successfully:', userData);

    res.json({
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: 'File upload error: ' + err.message });
      return;
    } else if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    try {
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete old profile image if it exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '../../', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      if (req.file) {
        user.profileImage = req.file.path.replace(/\\/g, '/');
        await user.save();

        res.json({
          message: 'Profile image updated successfully',
          profileImage: user.profileImage
        });
      } else {
        res.status(400).json({ error: 'No file uploaded' });
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ error: 'Failed to update profile image' });
    }
  });
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genres } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.preferences = {
      ...user.preferences,
      genres: genres || []
    };

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user's profile image if exists
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete user's books
    await Book.deleteMany({ owner: req.userId });

    // Update transactions
    await Transaction.updateMany(
      { $or: [{ requester: req.userId }, { owner: req.userId }] },
      { status: 'cancelled' }
    );

    // delete the user
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};