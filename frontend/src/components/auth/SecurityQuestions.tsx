import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik, FormikTouched } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { authAPI } from '../../services/api';
import { SECURITY_QUESTIONS } from '../constants/security';

interface FormValues {
  email: string;
  answers: string[];
  newPassword: string;
  confirmPassword: string;
}

const validationSchemas = [
  // Email validation
  Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    answers: Yup.array().of(Yup.string())
  }),
  // Security answers validation
  Yup.object().shape({
    email: Yup.string().email('Invalid email'),
    answers: Yup.array()
      .of(Yup.string().required('Answer is required'))
      .length(3, 'All questions must be answered')
  }),
  // New password validation
  Yup.object().shape({
    email: Yup.string().email('Invalid email'),
    answers: Yup.array().of(Yup.string()),
    newPassword: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Please confirm your password')
  })
];

const SecurityQuestions = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      email: '',
      answers: ['', '', ''],
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: validationSchemas[activeStep],
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);

        if (activeStep === 0) {
          setActiveStep(1);
        } else if (activeStep === 1) {
          await authAPI.verifySecurityAnswers(values.email, values.answers);
          setActiveStep(2);
        } else {
          await authAPI.resetPasswordWithSecurityAnswers(
            values.email,
            values.answers,
            values.newPassword
          );
          enqueueSnackbar('Password reset successful', { variant: 'success' });
          navigate('/login');
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Failed to process request';
        setError(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const getFieldError = (index: number) => {
    const touched = formik.touched.answers as FormikTouched<string[]> | undefined;
    const errors = formik.errors.answers as string[] | undefined;
    
    return touched && touched[index] && errors && errors[index];
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password with Security Questions
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Email</StepLabel>
          </Step>
          <Step>
            <StepLabel>Security</StepLabel>
          </Step>
          <Step>
            <StepLabel>New Password</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          {activeStep === 0 && (
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
              disabled={isLoading}
            />
          )}

          {activeStep === 1 && (
            <Box>
              {SECURITY_QUESTIONS.map((question, index) => (
                <TextField
                  key={index}
                  fullWidth
                  id={`answers.${index}`}
                  name={`answers.${index}`}
                  label={question}
                  value={formik.values.answers[index]}
                  onChange={formik.handleChange}
                  error={Boolean(getFieldError(index))}
                  helperText={getFieldError(index)}
                  margin="normal"
                  disabled={isLoading}
                />
              ))}
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <TextField
                fullWidth
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                helperText={formik.touched.newPassword && formik.errors.newPassword}
                margin="normal"
                disabled={isLoading}
              />
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                margin="normal"
                disabled={isLoading}
              />
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
            )}
            <Box sx={{ flex: '1 1 auto' }} />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !formik.isValid}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : activeStep === 2 ? (
                'Reset Password'
              ) : (
                'Next'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              size="small"
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default SecurityQuestions;