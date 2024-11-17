import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Book, BookLocation, DeliveryMethod, ExchangeTerms } from '../../types/models';
import { exchangeAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ExchangeRequestDialogProps {
  open: boolean;
  onClose: () => void;
  book: Book;
}


const getFieldHelperText = (
  touched: boolean | undefined,
  error: string | undefined
): string | undefined => {
  return touched && error ? error : undefined;
};

const validationSchema = Yup.object({
  deliveryMethod: Yup.string()
    .required('Delivery method is required')
    .oneOf(['in-person', 'courier', 'mail'] as DeliveryMethod[]),
  duration: Yup.number()
    .required('Duration is required')
    .min(1, 'Duration must be at least 1 day')
    .max(90, 'Duration cannot exceed 90 days'),
    location: Yup.string()
    .when('deliveryMethod', {
      is: 'in-person',
      then: (schema) => schema.required('Location is required for in-person delivery'),
      otherwise: (schema) => schema.optional()
    }),
  additionalNotes: Yup.string()
    .max(500, 'Notes cannot exceed 500 characters'),
  message: Yup.string()
    .required('Please provide a message to the owner')
    .max(1000, 'Message cannot exceed 1000 characters')
});

const ExchangeRequestDialog = ({ open, onClose, book }: ExchangeRequestDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      deliveryMethod: 'in-person' as DeliveryMethod,
      duration: 7,
      location: '',
      additionalNotes: '',
      message: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setError(null);

        const terms: ExchangeTerms = {
          deliveryMethod: values.deliveryMethod,
          duration: values.duration,
          location: values.location as BookLocation,
          additionalNotes: values.additionalNotes
        };

        await exchangeAPI.createRequest(book.id, terms, values.message);
        enqueueSnackbar('Exchange request sent successfully', { variant: 'success' });
        onClose();
      } catch (error: any) {
        console.error('Create request error:', error);
        const errorMessage = error.message || 'Failed to create exchange request';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleClose = () => {
    formik.resetForm();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Book Exchange</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1">Book Details</Typography>
            <Typography variant="h6">{book.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              by {book.author}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Owner: {book.owner.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Delivery Method</InputLabel>
              <Select
                name="deliveryMethod"
                value={formik.values.deliveryMethod}
                onChange={formik.handleChange}
                error={formik.touched.deliveryMethod && Boolean(formik.errors.deliveryMethod)}
              >
                <MenuItem value="in-person">In Person</MenuItem>
                <MenuItem value="courier">Courier</MenuItem>
                <MenuItem value="mail">Mail</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              name="duration"
              label="Duration (days)"
              type="number"
              value={formik.values.duration}
              onChange={formik.handleChange}
              error={formik.touched.duration && Boolean(formik.errors.duration)}
              helperText={getFieldHelperText(
                Boolean(formik.touched.duration), 
                formik.errors.duration?.toString()
              )}            
            />

            {formik.values.deliveryMethod === 'in-person' && (
              <TextField
                fullWidth
                name="location"
                label="Meeting Location"
                value={formik.values.location}
                onChange={formik.handleChange}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={getFieldHelperText(
                  Boolean(formik.touched.location), 
                  formik.errors.location?.toString()
                )}              
              />
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              name="message"
              label="Message to Owner"
              value={formik.values.message}
              onChange={formik.handleChange}
              error={formik.touched.message && Boolean(formik.errors.message)}
              helperText={getFieldHelperText(formik.touched.message, formik.errors.message)}
              placeholder="Introduce yourself and explain why you're interested in this book..."
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              name="additionalNotes"
              label="Additional Notes (Optional)"
              value={formik.values.additionalNotes}
              onChange={formik.handleChange}
              error={formik.touched.additionalNotes && Boolean(formik.errors.additionalNotes)}
              helperText={getFieldHelperText(
                Boolean(formik.touched.additionalNotes), 
                formik.errors.additionalNotes?.toString()
              )}
            />

          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting || !formik.isValid}
          >
            {formik.isSubmitting ? <CircularProgress size={24} /> : 'Send Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExchangeRequestDialog;