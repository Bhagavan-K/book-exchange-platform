import axios from 'axios';
import { BookCondition, BookStatus, BookLocation, Exchange, ExchangeStatus, ExchangeTerms } from '../types/models';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface BookResponse {
  books: Book[];
  pagination: PaginationResponse;
}

interface ApiResponse<T = any> {
  books: any;
  data: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  profileImage?: string;
  preferences: {
    genres: string[];
  };
  reputation?: number;
  createdAt?: string;
}


interface Book {
  location: string;
  description: string | undefined;
  createdAt: string;
  id: string;
  title: string;
  author: string;
  genre: string;
  condition: string;
  status: string;
  owner: User;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      error: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    securityAnswers: string[];
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register API Error:', error);
      throw error;
    }
  },

  verifyEmail: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', { email });
    return response.data;
  },

  verifySecurityAnswers: async (email: string, answers: string[]) => {
    const response = await api.post<ApiResponse>('/auth/verify-security-answers', {
      email,
      answers
    });
    return response.data;
  },

  resetPasswordWithSecurityAnswers: async (
    email: string,
    answers: string[],
    newPassword: string
  ) => {
    const response = await api.post<ApiResponse>('/auth/reset-password-security', {
      email,
      answers,
      newPassword
    });
    return response.data;
  },
  
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      console.log('Login API call:', {
        url: `${BASE_URL}/auth/login`,
        email: credentials.email
      });
  
      const response = await api.post('/auth/login', credentials);
      console.log('Raw login response:', response.data);
  
      const userData: User = {
        id: response.data.user.id || response.data.user._id || '',
        name: response.data.user.name,
        email: response.data.user.email,
        preferences: {
          genres: response.data.user.preferences?.genres || []
        },
        location: (response.data.user.location || '') as BookLocation,
        bio: response.data.user.bio || '',
        reputation: response.data.user.reputation || 0,
        profileImage: response.data.user.profileImage,
        createdAt: response.data.user.createdAt
      };
  
      console.log('Processed user data:', userData);
  
      return {
        token: response.data.token,
        user: userData
      };
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },
};

export const bookAPI = {
  getBooks: async (page: number = 1, filters: {
    search?: string;
    genre?: string;
    condition?: string;
    location?: string;
    sortBy?: string;
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      
      if (filters.search) params.append('search', filters.search);
      if (filters.genre && filters.genre !== 'All') params.append('genre', filters.genre);
      if (filters.condition && filters.condition !== 'All') params.append('condition', filters.condition);
      if (filters.location && filters.location !== 'All') params.append('location', filters.location);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const response = await api.get<{ data: BookResponse }>(`/books?${params.toString()}`);
      
      if (!response.data?.data) {
        throw new Error('Invalid response format');
      }

      return response.data;
    } catch (error) {
      console.error('Get books error:', error);
      throw error;
    }
  },

  getUserBooks: async () => {
    try {
      const response = await api.get<ApiResponse<{ books: Book[] }>>('/books/user');
      
      if (!response.data?.data?.books) {
        throw new Error('Invalid response format');
      }

      return {
        books: response.data.data.books.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          condition: book.condition as BookCondition,
          status: book.status as BookStatus,
          location: book.location as BookLocation,
          description: book.description,
          owner: {
            id: book.owner.id,
            name: book.owner.name,
            email: book.owner.email,
            preferences: {
              genres: book.owner.preferences?.genres || []
            }
          },
          createdAt: book.createdAt
        }))
      };
    } catch (error) {
      console.error('Get user books error:', error);
      throw error;
    }
  },
  
  addBook: async (bookData: {
    title: string;
    author: string;
    genre: string;
    condition: string;
    location: string;
    description?: string;
  }) => {
    try {
      const response = await api.post<{ data: { book: Book } }>('/books', bookData);
      return response.data;
    } catch (error) {
      console.error('Add book error:', error);
      throw error;
    }
  },


  updateBook: async (bookId: string, bookData: Partial<Book>): Promise<Book> => {
    try {
      console.log('Updating book:', { bookId, bookData });
      const response = await api.patch<Book>(`/books/${bookId}`, bookData);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }

      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update book error:', error);
      throw error;
    }
  },

  deleteBook: async (id: string) => {
    try {
      await api.delete<ApiResponse>(`/books/${id}`);
    } catch (error) {
      console.error('Delete book error:', error);
      throw error;
    }
  },
};

export const userAPI = {
  getProfile: async (): Promise<User> => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get<ApiResponse<User>>('/users/profile');
      console.log('Profile response:', response.data);
      
      if (!response.data?.data) {
        throw new Error('Invalid response format');
      }

      const responseData = response.data.data;
      
      const userData: User = {
        id: responseData.id || responseData._id || '',
        name: responseData.name,
        email: responseData.email,
        preferences: {
          genres: responseData.preferences?.genres || []
        },
        location: responseData.location || '',
        bio: responseData.bio || '',
        reputation: responseData.reputation || 0,
        profileImage: responseData.profileImage,
        createdAt: responseData.createdAt
      };

      console.log('Processed user data:', userData);
      return userData;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    try {
      console.log('API: Updating profile with:', userData);
      const response = await api.patch<ApiResponse<User>>('/users/profile', userData);
      
      if (!response.data?.data) {
        throw new Error('Invalid response format');
      }

      const responseData = response.data.data;

      const updatedUser: User = {
        id: responseData.id || responseData._id || '',
        name: responseData.name,
        email: responseData.email,
        preferences: {
          genres: responseData.preferences?.genres || []
        },
        location: responseData.location || '',
        bio: responseData.bio || '',
        profileImage: responseData.profileImage,
        reputation: responseData.reputation,
        createdAt: responseData.createdAt
      };

      console.log('API: Profile update response:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('API: Update profile error:', error);
      throw error;
    }
  },

  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    try {
      await api.patch('/users/profile/password', passwordData);
    } catch (error: any) {
      console.error('Password update error:', error);
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete<ApiResponse>('/users/account');
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  updateProfileImage: async (formData: FormData): Promise<{ profileImage: string }> => {
    try {
      const response = await api.post<ApiResponse<{ profileImage: string }>>(
        '/users/profile/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data?.data?.profileImage) {
        throw new Error('Invalid response format');
      }

      return {
        profileImage: response.data.data.profileImage
      };
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  },

  getUserStats: async (): Promise<{
    totalBooks: number;
    activeExchanges: number;
    completedExchanges: number;
    reputation: number;
  }> => {
    const response = await api.get<ApiResponse<{
      totalBooks: number;
      activeExchanges: number;
      completedExchanges: number;
      reputation: number;
    }>>('/users/stats');
    
    return {
      totalBooks: response.data.data.totalBooks || 0,
      activeExchanges: response.data.data.activeExchanges || 0,
      completedExchanges: response.data.data.completedExchanges || 0,
      reputation: response.data.data.reputation || 0
    };
  },
};


export const exchangeAPI = {
  createRequest: async (bookId: string, terms: ExchangeTerms, message?: string): Promise<Exchange> => {
    try {
      console.log('Creating exchange request:', { bookId, terms, message });
      
      const response = await api.post<ApiResponse<Exchange>>('/transactions/request', {
        bookId,
        terms,
        message
      });

      if (!response.data?.data) {
        throw new Error(response.data?.error || 'Failed to create exchange request');
      }

      console.log('Exchange request created:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create exchange request error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create exchange request';
      throw new Error(errorMessage);
    }
  },

  updateRequestStatus: async (
    requestId: string,
    status: ExchangeStatus,
    terms?: Partial<ExchangeTerms>,
    message?: string
  ): Promise<Exchange> => {
    try {
      console.log('Updating request status:', { requestId, status, terms, message });
      
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const response = await api.patch<ApiResponse<Exchange>>(
        `/transactions/${requestId}/status`,
        {
          status,
          terms,
          message
        }
      );

      if (!response.data?.data) {
        throw new Error('Invalid response format');
      }

      console.log('Update status response:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update exchange status error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  handleExchangeAction: async (exchangeId: string, action: string, message?: string): Promise<Exchange> => {
    try {
      let status: ExchangeStatus;
      switch (action) {
        case 'accept':
          status = 'accepted';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'withdraw':
          status = 'cancelled';
          break;
        default:
          throw new Error('Invalid action');
      }

      return await exchangeAPI.updateRequestStatus(
        exchangeId,
        status,
        undefined,
        message
      );
    } catch (error: any) {
      console.error('Handle exchange action error:', error);
      throw error;
    }
  },

  getMyRequests: async (): Promise<Exchange[]> => {
    try {
      const response = await api.get<ApiResponse<Exchange[]>>('/transactions/sent');
      return response.data.data;
    } catch (error) {
      console.error('Get sent requests error:', error);
      throw error;
    }
  },

  getReceivedRequests: async (): Promise<Exchange[]> => {
    try {
      const response = await api.get<ApiResponse<Exchange[]>>('/transactions/received');
      return response.data.data;
    } catch (error) {
      console.error('Get received requests error:', error);
      throw error;
    }
  },

  getUserExchanges: async (status?: ExchangeStatus): Promise<Exchange[]> => {
    try {
      const params = status ? { status } : {};
      const response = await api.get<ApiResponse<Exchange[]>>('/transactions/user', { params });
      return response.data.data;
    } catch (error) {
      console.error('Get user exchanges error:', error);
      throw error;
    }
  },

  getExchangeDetails: async (exchangeId: string): Promise<Exchange> => {
    try {
      const response = await api.get<ApiResponse<Exchange>>(`/transactions/${exchangeId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get exchange details error:', error);
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<ApiResponse<{ unreadCount: number }>>('/transactions/notifications/unread');
      return response.data.data.unreadCount;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  },
  sendMessage: async (exchangeId: string, message: string): Promise<Exchange> => {
    try {
      if (!exchangeId) {
        throw new Error('Exchange ID is required');
      }

      const response = await api.post<ApiResponse<Exchange>>(
        `/transactions/${exchangeId}/messages`,
        { message }
      );

      if (!response.data?.data) {
        throw new Error('Invalid response format');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Send message error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
};

export default api;