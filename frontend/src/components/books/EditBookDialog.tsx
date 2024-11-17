import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Book, BookCondition, BookLocation, BookStatus, BookUpdateData } from '../../types/models';
import { bookAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import { INDIAN_CITIES } from './BookList';

interface EditBookDialogProps {
  book: Book;
  open: boolean;
  onClose: () => void;
  onUpdate: (updatedBook: Book) => void;
}

const genres = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Science Fiction',
  'Fantasy',
  'Romance',
  'Thriller',
  'Horror',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Self-Help'
];

const conditions: BookCondition[] = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(2, 'Title must be at least 2 characters'),
  author: Yup.string()
    .required('Author is required')
    .min(2, 'Author name must be at least 2 characters'),
  genre: Yup.string()
    .required('Genre is required'),
  condition: Yup.string()
    .required('Condition is required')
    .oneOf(conditions, 'Invalid condition'),
  location: Yup.string()
    .required('Location is required')
    .oneOf(INDIAN_CITIES.map(city => city.name), 'Invalid location'),
  description: Yup.string()
    .max(500, 'Description must be at most 500 characters')
});

const EditBookDialog = ({ book, open, onClose, onUpdate }: EditBookDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      title: book.title,
      author: book.author,
      genre: book.genre,
      condition: book.condition,
      location: book.location,
      description: book.description || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setError(null);
    
        const updateData: BookUpdateData = {
          title: values.title,
          author: values.author,
          genre: values.genre,
          condition: values.condition as BookCondition,
          location: values.location as BookLocation,
          description: values.description || undefined
        };

        const updatedBook = await bookAPI.updateBook(book.id, updateData);
        console.log('Response from update:', updatedBook);

        onUpdate({
          ...book,
          ...updatedBook,
          condition: updatedBook.condition as BookCondition,
          status: updatedBook.status as BookStatus,
          location: updatedBook.location as BookLocation,
          owner: {
            ...book.owner,
            preferences: book.owner.preferences || { genres: [] }
          }
        });
        
        onClose();
      } catch (err: any) {
        console.error('Update error:', err);
        setError(err.response?.data?.error || 'Failed to update book');
        enqueueSnackbar('Failed to update book', { variant: 'error' });
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
      <DialogTitle>Edit Book</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              id="title"
              name="title"
              label="Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              id="author"
              name="author"
              label="Author"
              value={formik.values.author}
              onChange={formik.handleChange}
              error={formik.touched.author && Boolean(formik.errors.author)}
              helperText={formik.touched.author && formik.errors.author}
              disabled={isSubmitting}
            />

            <TextField
              fullWidth
              select
              id="genre"
              name="genre"
              label="Genre"
              value={formik.values.genre}
              onChange={formik.handleChange}
              error={formik.touched.genre && Boolean(formik.errors.genre)}
              helperText={formik.touched.genre && formik.errors.genre}
              disabled={isSubmitting}
            >
              {genres.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              id="condition"
              name="condition"
              label="Condition"
              value={formik.values.condition}
              onChange={formik.handleChange}
              error={formik.touched.condition && Boolean(formik.errors.condition)}
              helperText={formik.touched.condition && formik.errors.condition}
              disabled={isSubmitting}
            >
              {conditions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              id="location"
              name="location"
              label="Location"
              value={formik.values.location}
              onChange={formik.handleChange}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
              disabled={isSubmitting}
            >
              {INDIAN_CITIES.map((city) => (
                <MenuItem key={city.name} value={city.name}>
                  {city.name}, {city.state}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              id="description"
              name="description"
              label="Description (Optional)"
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              disabled={isSubmitting}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditBookDialog;