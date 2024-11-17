import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Divider,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { authAPI } from '../../services/api';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await authAPI.verifyEmail(values.email);
        setEmailSent(true);
        enqueueSnackbar('If the email exists, you will receive reset instructions', { 
          variant: 'success' 
        });
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.error || 'Failed to process request', {
          variant: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {emailSent ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              If an account exists with this email, you will receive password reset instructions.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your email address below and we'll send you instructions to reset your password.
            </Typography>

            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              margin="normal"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              Send Reset Instructions
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/reset-password/security')}
              sx={{ mb: 2 }}
            >
              Use Security Questions
            </Button>

            <Box textAlign="center">
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                size="small"
              >
                Back to Login
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;