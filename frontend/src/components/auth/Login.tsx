import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Link,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import { User, BookLocation } from '../../types/models';

interface ApiLoginResponse {
  token: string;
  user: {
    id: string;
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
  };
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const validateLocation = (location?: string): BookLocation | undefined => {
  if (!location) return undefined;
  const validLocations: BookLocation[] = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'All'];
  return validLocations.includes(location as BookLocation) ? (location as BookLocation) : undefined;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        
        const response: ApiLoginResponse = await authAPI.login(values);
        
        if (response?.token && response?.user) {
          const validatedUser: User = {
            ...response.user,
            location: validateLocation(response.user.location),
            preferences: {
              genres: response.user.preferences?.genres || []
            }
          };

          login(response.token, validatedUser);
          enqueueSnackbar('Login successful!', { variant: 'success' });
          navigate('/');
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error: any) {
        console.error('Login error details:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Login failed';
        setErrorMessage(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login to Book Exchange
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            margin="normal"
            autoComplete="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            margin="normal"
            autoComplete="current-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't have an account?{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/register')}
                disabled={isSubmitting}
              >
                Register here
              </Link>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                disabled={isSubmitting}
              >
                Forgot password?
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;