import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import Login from '../../../components/auth/Login';
import { AuthProvider } from '../../../context/AuthContext';
import { authAPI } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  authAPI: {
    login: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () => {
  render(
    <BrowserRouter>
      <SnackbarProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    renderLogin();
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderLogin();
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

  });

  test('handles successful login', async () => {
    const mockLoginResponse = {
      token: 'test-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        preferences: { genres: [] }
      }
    };

    (authAPI.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
    
    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles login error', async () => {
    (authAPI.login as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } }
    });
    
    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});