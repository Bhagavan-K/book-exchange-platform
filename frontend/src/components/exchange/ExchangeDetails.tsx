import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { Exchange, ExchangeStatus } from '../../types/models';
import { exchangeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

interface ExchangeDetailsProps {
  exchange: Exchange;
  onUpdate: (exchange: Exchange) => void;
  onClose: () => void;
}

interface ActionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  title: string;
  action: string;
}

const ActionDialog = ({ open, onClose, onSubmit, title, action }: ActionDialogProps) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isWithdraw = action.toLowerCase() === 'withdraw';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button onClick={onClose} disabled={submitting}>
          {isWithdraw ? "No, Keep Request" : "Cancel"}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color={isWithdraw ? "error" : "primary"}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : (isWithdraw ? "Yes, Withdraw" : action)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MessageList = ({ messages, currentUserId }: { 
  messages: Exchange['messages']; 
  currentUserId: string;
}) => {
  return (
    <Box sx={{ maxHeight: '300px', overflowY: 'auto', p: 1 }}>
      {messages.map((message, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            justifyContent: message.sender.id === currentUserId ? 'flex-end' : 'flex-start',
            mb: 1
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              maxWidth: '80%',
              bgcolor: message.sender.id === currentUserId ? 'primary.light' : 'grey.100',
              color: message.sender.id === currentUserId ? 'white' : 'inherit'
            }}
          >
            <Typography variant="caption" display="block" color={message.sender.id === currentUserId ? 'inherit' : 'text.secondary'}>
              {message.sender.name}
            </Typography>
            <Typography variant="body2">{message.content}</Typography>
            <Typography variant="caption" display="block" color={message.sender.id === currentUserId ? 'inherit' : 'text.secondary'}>
              {new Date(message.createdAt).toLocaleString()}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

const getStatusColor = (status: ExchangeStatus): "success" | "error" | "warning" | "info" | "default" => {
  switch (status) {
    case 'accepted': return 'success';
    case 'rejected': return 'error';
    case 'pending': return 'warning';
    case 'modified': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const ExchangeDetails = ({ exchange, onUpdate, onClose }: ExchangeDetailsProps) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    title: string;
    action: string;
    status: ExchangeStatus;
  }>({ open: false, title: '', action: '', status: 'pending' });

  const handleStatusUpdate = async (message: string) => {
    try {
      console.log('Updating status:', dialogConfig.status, message);
      
      const updatedExchange = await exchangeAPI.updateRequestStatus(
        exchange.id,
        dialogConfig.status,
        undefined,
        message || undefined
      );
      
      onUpdate(updatedExchange);
      enqueueSnackbar('Exchange status updated successfully', { variant: 'success' });
      setDialogConfig({ open: false, title: '', action: '', status: 'pending' });
    } catch (error: any) {
      console.error('Status update error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update status';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MessageInput = ({ onSend, disabled }: { onSend: (message: string) => Promise<void>, disabled?: boolean }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
  
    const handleSend = async () => {
      if (!message.trim()) return;
      
      try {
        setSending(true);
        await onSend(message.trim());
        setMessage('');
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.error || 'Failed to send message', { variant: 'error' });
      } finally {
        setSending(false);
      }
    };
  
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending || disabled}
          multiline
          maxRows={4}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          startIcon={<SendIcon />}
        >
          Send
        </Button>
      </Box>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [exchange.messages]);

  const handleAction = (status: ExchangeStatus, title: string, action: string) => {
    console.log('Handling action:', { status, title, action });
    setDialogConfig({ open: true, title, action, status });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !exchange?.id) return;

    try {
      setSending(true);
      const response = await exchangeAPI.sendMessage(exchange.id, newMessage.trim());
      setNewMessage('');
      onUpdate(response);
      enqueueSnackbar('Message sent successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Send message error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Failed to send message', {
        variant: 'error'
      });
    } finally {
      setSending(false);
    }
  };


  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>Exchange Request Details</Typography>
          <Chip 
            label={exchange.status} 
            color={getStatusColor(exchange.status)} 
            sx={{ mb: 2 }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Book Details</Typography>
            <Typography variant="subtitle1">{exchange.book.title}</Typography>
            <Typography color="text.secondary" gutterBottom>
              by {exchange.book.author}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Condition: {exchange.book.condition}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Exchange Terms</Typography>
            <Typography variant="body2">
              Delivery Method: {exchange.terms.deliveryMethod}
            </Typography>
            <Typography variant="body2">
              Duration: {exchange.terms.duration} days
            </Typography>
            {exchange.terms.location && (
              <Typography variant="body2">
                Location: {exchange.terms.location}
              </Typography>
            )}
            {exchange.terms.additionalNotes && (
              <Typography variant="body2">
                Notes: {exchange.terms.additionalNotes}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Messages</Typography>
        <Box sx={{ mb: 3 }}>
          <MessageList messages={exchange.messages} currentUserId={user?.id || ''} />
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              startIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Box>

        {exchange.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {user?.id === exchange.owner.id ? (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleAction('accepted', 'Accept Request', 'Accept')}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleAction('rejected', 'Reject Request', 'Reject')}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleAction('cancelled', 'Withdraw Request', 'Withdraw')}
              >
                Withdraw Request
              </Button>
            )}
          </Box>
        )}

        {exchange.status === 'accepted' && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleAction('completed', 'Complete Exchange', 'Complete')}
            >
              Mark as Completed
            </Button>
          </Box>
        )}
      </CardContent>

      <ActionDialog
        open={dialogConfig.open}
        onClose={() => setDialogConfig({ ...dialogConfig, open: false })}
        onSubmit={handleStatusUpdate}
        title={dialogConfig.title}
        action={dialogConfig.action}
      />
    </Card>
  );
};

export default ExchangeDetails;