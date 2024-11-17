import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ open, onClose }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmation.toLowerCase() !== 'delete my account') {
      setError('Please type the confirmation text exactly as shown');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await userAPI.deleteAccount();
      
      enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      logout();
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete account';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmation('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
          This action cannot be undone. This will permanently delete your account,
          all your books, and remove you from all exchange requests.
        </Typography>

        <Typography variant="body2" color="error" gutterBottom>
          Please type "delete my account" to confirm:
        </Typography>

        <TextField
          fullWidth
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="delete my account"
          disabled={isSubmitting}
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
          disabled={isSubmitting || confirmation.toLowerCase() !== 'delete my account'}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Delete Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountDialog;