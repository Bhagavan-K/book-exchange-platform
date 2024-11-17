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
  CircularProgress,
  Divider
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import { SECURITY_QUESTIONS } from '../constants/security';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  securityAnswers: Yup.array()
    .of(Yup.string().required('Security answer is required'))
    .min(3, 'All security questions must be answered')
});

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      securityAnswers: ['', '', '']
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);

        const { confirmPassword, ...registerData } = values;
        const response = await authAPI.register({
          ...registerData,
          securityAnswers: values.securityAnswers.map(answer => answer.trim())
        });

        if (response && response.token && response.user) {
          login(response.token, response.user);
          enqueueSnackbar('Registration successful!', { variant: 'success' });
          navigate('/');
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
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
          Create an Account
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Basic Information
          </Typography>
          
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Full Name"
            margin="normal"
            autoComplete="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={isSubmitting}
          />

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
            autoComplete="new-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            margin="normal"
            autoComplete="new-password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={isSubmitting}
          />

          <Divider sx={{ my: 3 }} />

          {/* Security Questions */}
          <Typography variant="h6" gutterBottom>
            Security Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please answer these security questions. You'll need these answers if you ever need to reset your password.
          </Typography>

          {SECURITY_QUESTIONS.map((question, index) => (
          <TextField
            key={index}
            fullWidth
            id={`securityAnswers.${index}`}
            name={`securityAnswers.${index}`}
            label={question}
            margin="normal"
            value={formik.values.securityAnswers[index]}
            onChange={formik.handleChange}
            error={
              formik.touched.securityAnswers &&
              Array.isArray(formik.touched.securityAnswers) &&
              formik.touched.securityAnswers[index] &&
              Array.isArray(formik.errors.securityAnswers) &&
              Boolean(formik.errors.securityAnswers[index])
            }
            helperText={
              formik.touched.securityAnswers &&
              Array.isArray(formik.touched.securityAnswers) &&
              formik.touched.securityAnswers[index] &&
              Array.isArray(formik.errors.securityAnswers) &&
              formik.errors.securityAnswers &&
              formik.errors.securityAnswers[index]
            }
            disabled={isSubmitting}
          />
        ))}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/login')}
                disabled={isSubmitting}
              >
                Login here
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;