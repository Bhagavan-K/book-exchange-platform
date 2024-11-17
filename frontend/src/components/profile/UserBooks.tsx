import { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { bookAPI } from '../../services/api';
import { Book } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import EditBookDialog from '../books/EditBookDialog';

const UserBookCard = ({ book, onEdit, onDelete }: { 
  book: Book; 
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(book);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(book.id);
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <IconButton 
        sx={{ position: 'absolute', top: 8, right: 8 }}
        onClick={handleMenuClick}
      >
        <MoreVertIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" />
          Delete
        </MenuItem>
      </Menu>

      <CardContent>
        <Typography variant="h6" gutterBottom>
          {book.title}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          by {book.author}
        </Typography>
        {book.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            {book.description}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={book.genre} color="primary" variant="outlined" size="small" />
          <Chip label={book.condition} color="default" size="small" />
          <Chip 
            label={book.status} 
            color={book.status === 'available' ? 'success' : 
                   book.status === 'pending' ? 'warning' : 'error'} 
            size="small" 
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const UserBooks = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteDialogBook, setDeleteDialogBook] = useState<string | null>(null);

  const fetchUserBooks = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await bookAPI.getUserBooks();
      setBooks(response.books);
    } catch (err: any) {
      console.error('Error fetching books:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch your books';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, enqueueSnackbar]);

  useEffect(() => {
    fetchUserBooks();
  }, [fetchUserBooks]);

  const handleEdit = (book: Book) => {
    setEditingBook(book);
  };

  const handleUpdate = async (updatedBook: Book) => {
    try {
      await bookAPI.updateBook(updatedBook.id, updatedBook);
      setBooks(books.map(book => book.id === updatedBook.id ? updatedBook : book));
      enqueueSnackbar('Book updated successfully', { variant: 'success' });
      setEditingBook(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to update book', {
        variant: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogBook) return;

    try {
      await bookAPI.deleteBook(deleteDialogBook);
      setBooks(books.filter(book => book.id !== deleteDialogBook));
      enqueueSnackbar('Book deleted successfully', { variant: 'success' });
      setDeleteDialogBook(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete book', {
        variant: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          My Books ({books.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-book')}
        >
          Add New Book
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {books.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You haven't listed any books yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start by adding your first book to exchange!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {books.map((book) => (
            <Grid item xs={12} sm={6} key={book.id}>
              <UserBookCard
                book={book}
                onEdit={handleEdit}
                onDelete={setDeleteDialogBook}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      {editingBook && (
        <EditBookDialog
          open={Boolean(editingBook)}
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteDialogBook)}
        onClose={() => setDeleteDialogBook(null)}
      >
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this book? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogBook(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserBooks;