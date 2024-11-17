import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/models';
import { userAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const ensureUserData = (userData: any): User => {
  console.log('Ensuring user data structure:', userData);
  return {
    ...userData,
    id: userData.id || userData._id,
    preferences: {
      genres: userData.preferences?.genres || []
    },
    location: userData.location || '',
    bio: userData.bio || '',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      console.log('Initializing with saved user:', savedUser);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        return ensureUserData(parsedUser);
      }
      return null;
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('user'); // Clear invalid data
      return null;
    }
  });
  
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem('token')
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    !!localStorage.getItem('token')
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.clear();
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!token) return;
    
    try {
      console.log('Refreshing user data...');
      const userData = await userAPI.getProfile();
      console.log('Received fresh user data:', userData);
      
      const validatedUser = ensureUserData(userData);
      console.log('Validated user data:', validatedUser);
      
      setUser(validatedUser);
      localStorage.setItem('user', JSON.stringify(validatedUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      if ((error as any).response?.status === 401) {
        logout();
      }
    }
  }, [token, logout]);

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;
      
      console.log('Updating user with:', userData);
      const response = await userAPI.updateProfile(userData);
      console.log('Update response:', response);
      
      const updatedUser = ensureUserData({
        ...user,
        ...response,
      });
      
      console.log('Setting updated user:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      await refreshUserData();
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const login = useCallback((newToken: string, userData: User) => {
    console.log('Logging in with data:', { token: newToken, userData });
    const validatedUser = ensureUserData(userData);
    console.log('Validated login user data:', validatedUser);
    
    setToken(newToken);
    setUser(validatedUser);
    setIsAuthenticated(true);
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(validatedUser));
  }, []);

  useEffect(() => {
    if (isAuthenticated && !user) {
      console.log('User is authenticated but no user data, refreshing...');
      refreshUserData();
    }
  }, [isAuthenticated, user, refreshUserData]);

  const contextValue = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUserData
  };

  console.log('AuthContext current state:', {
    hasUser: !!user,
    hasToken: !!token,
    isAuthenticated
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};