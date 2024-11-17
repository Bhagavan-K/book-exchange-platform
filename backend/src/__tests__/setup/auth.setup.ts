import User, { IUser } from '../../models/User';
import bcrypt from 'bcryptjs';

export const createTestUser = async (userData: {
  name: string;
  email: string;
  password: string;
  securityAnswers: string[];
}) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const user = await User.create({
    ...userData,
    password: hashedPassword
  });

  return user;
};

export const clearUsers = async () => {
  await User.deleteMany({});
};