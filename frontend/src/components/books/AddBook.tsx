import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Grid,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { bookAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_CITIES } from './BookList';
import { genres, conditions } from './SearchFilters';

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
    .required('Condition is required'),
  location: Yup.string()
    .required('Location is required'),
  description: Yup.string()
    .max(500, 'Description must be at most 500 characters'),
});

const AddBook = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const formik = useFormik({
    initialValues: {
      title: '',
      author: '',
      genre: '',
      condition: '',
      location: user?.location || '',
      description: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await bookAPI.addBook(values);
        enqueueSnackbar('Book added successfully!', { variant: 'success' });
        navigate('/books');
      } catch (error: any) {
        enqueueSnackbar(
          error.response?.data?.error || 'Failed to add book',
          { variant: 'error' }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Add New Book
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Book Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
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
            </Grid>

            <Grid item xs={12} sm={6}>
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
                {genres.filter(genre => genre !== 'All').map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
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
                {conditions.filter(condition => condition !== 'All').map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
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
            </Grid>

            <Grid item xs={12}>
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
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
            >
              Add Book
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/books')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AddBook;