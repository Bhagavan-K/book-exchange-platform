import { Dialog, DialogTitle, DialogContent, Alert, Box, Typography, TextField, DialogActions, Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { ExchangeStatus } from "../../../types/models";

interface ActionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  title: string;
  action: string;
  status?: ExchangeStatus;
}

export const ActionDialog = ({ open, onClose, onSubmit, title, action }: ActionDialogProps) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWithdraw = action.toLowerCase() === 'withdraw';

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(message);
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2 }}>
          {isWithdraw ? (
            <Typography>Are you sure you want to withdraw this exchange request?</Typography>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to explain your decision..."
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {isWithdraw ? "Keep Request" : "Cancel"}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color={isWithdraw ? "error" : "primary"}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : isWithdraw ? "Withdraw" : action}
        </Button>
      </DialogActions>
    </Dialog>
  );
};