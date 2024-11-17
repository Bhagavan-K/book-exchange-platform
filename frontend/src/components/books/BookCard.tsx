import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { Book } from '../../types/models';
import ExchangeRequestDialog from '../exchange/ExchangeRequestDialog';

interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
  showActions?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'success';
    case 'pending': return 'warning';
    case 'exchanged': return 'error';
    default: return 'default';
  }
};

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'New': return 'success';
    case 'Like New': return 'info';
    case 'Good': return 'primary';
    case 'Fair': return 'warning';
    case 'Poor': return 'error';
    default: return 'default';
  }
};

const BookCard = ({ book, onEdit, onDelete, showActions }: BookCardProps) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const isOwner = user?.id === book.owner.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit && onEdit(book);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete && onDelete(book.id);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showActions && isOwner && (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="small" onClick={handleMenuOpen}>
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
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      )}
      <CardContent>
        {isOwner && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton size="small" onClick={handleMenuOpen}>
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
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          {book.title}
        </Typography>
        
        <Typography color="text.secondary" gutterBottom>
          by {book.author}
        </Typography>

        {book.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mt: 1, 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {book.description}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={book.genre} color="primary" variant="outlined" size="small" />
          <Chip 
            label={book.condition} 
            color={getConditionColor(book.condition)} 
            size="small"
          />
          <Chip 
            label={book.status} 
            color={getStatusColor(book.status)} 
            size="small"
          />
        </Box>

        {!isOwner && book.status === 'available' && (
          <>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => setExchangeDialogOpen(true)}
            >
              Request Exchange
            </Button>

            <ExchangeRequestDialog 
              open={exchangeDialogOpen}
              onClose={() => setExchangeDialogOpen(false)}
              book={book}
            />
          </>
        )}

        {!isOwner && book.status === 'available' && book.owner && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Owner: {book.owner.name}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BookCard;