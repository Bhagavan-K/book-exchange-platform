import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Alert,
  Fab,
  Pagination,
  MenuItem,
  TextField,
  Stack
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import BookCard from './BookCard';
import SearchFilters from './SearchFilters';
import LoadingSpinner from '../common/LoadingSpinner';
import { bookAPI } from '../../services/api';
import { Book, BookLocation, BookCondition, BookStatus } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

export const INDIAN_CITIES = [
  { name: 'Mumbai' as BookLocation, state: 'Maharashtra' },
  { name: 'Delhi' as BookLocation, state: 'Delhi' },
  { name: 'Bangalore' as BookLocation, state: 'Karnataka' },
  { name: 'Chennai' as BookLocation, state: 'Tamil Nadu' },
  { name: 'Hyderabad' as BookLocation, state: 'Telangana' }
];


const BookList = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    genre: 'All',
    condition: 'All',
    location: (user?.location || 'All') as BookLocation | 'All',
    sortBy: 'recommended'
  });


  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookAPI.getBooks(page, {
        search: filters.search,
        genre: filters.genre !== 'All' ? filters.genre : undefined,
        condition: filters.condition !== 'All' ? filters.condition : undefined,
        location: filters.location !== 'All' ? filters.location : undefined,
        sortBy: filters.sortBy
      });
  
      // Transform and filter out user's own books
      const transformedBooks = response.data.books
        .filter(book => book.owner.id !== user?.id)
        .map(book => ({
          ...book,
          condition: book.condition as BookCondition,
          status: book.status as BookStatus,
          location: book.location as BookLocation,
          owner: {
            ...book.owner,
            preferences: book.owner.preferences || { genres: [] }
          }
        })) as Book[];
  
      setBooks(transformedBooks);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      console.error('Error fetching books:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch books';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, filters, enqueueSnackbar, user?.id]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (name: string, value: string) => {
    console.log('Filter changed:', name, value);
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Available Books
        </Typography>
      </Box>

      <Stack spacing={3}>
        <SearchFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <Box>
          <TextField
            select
            fullWidth
            label="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="All">All Locations</MenuItem>
            {INDIAN_CITIES.map((city) => (
              <MenuItem key={city.name} value={city.name}>
                {city.name}, {city.state}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {books.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No books found matching your criteria
                </Typography>
              </Box>
            </Grid>
          ) : (
            books.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.id}>
                <BookCard
                  book={book}
                  showActions={book.owner.id === user?.id}
                />
              </Grid>
            ))
          )}
        </Grid>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination 
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Stack>

      <Fab
        color="primary"
        aria-label="add book"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/add-book')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default BookList;