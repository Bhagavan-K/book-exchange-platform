import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Exchange, ExchangeStatus } from '../../types/models';
import { exchangeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ExchangeDetails from './ExchangeDetails';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const isValidExchange = (exchange: Exchange): boolean => {
  return !!(exchange && exchange.book && exchange.book.id && exchange.book.title);
};

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exchange-tabpanel-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
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

const ExchangeCard = ({ 
  exchange, 
  onAction, 
  onClick 
}: { 
  exchange: Exchange; 
  onAction: (action: string) => Promise<void>; 
  onClick: () => void; 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isValidExchange(exchange)) {
    return (
      <Card sx={{ mb: 2, p: 2 }}>
        <Typography color="error">
          This exchange request is no longer available (the book may have been deleted)
        </Typography>
      </Card>
    );
  }

  const isOwner = user?.id === exchange.owner.id;

  const handleAction = async (actionType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAction(actionType);
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' },
        position: 'relative'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Typography variant="h6" gutterBottom>
              {exchange.book.title}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              by {exchange.book.author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isOwner 
                ? `From: ${exchange.requester.name}`
                : `To: ${exchange.owner.name}`}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Chip 
              label={exchange.status} 
              color={getStatusColor(exchange.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block">
              {new Date(exchange.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        {exchange.status === 'pending' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {isOwner ? (
              <>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  disabled={isSubmitting}
                  onClick={(e) => handleAction('accept', e)}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={isSubmitting}
                  onClick={(e) => handleAction('reject', e)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={isSubmitting}
                onClick={(e) => handleAction('withdraw', e)}
              >
                Withdraw Request
              </Button>
            )}
          </Box>
        )}
      </CardContent>

      {isSubmitting && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Card>
  );
};

const ExchangeList = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const fetchExchanges = useCallback(async () => {
    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        exchangeAPI.getMyRequests(),
        exchangeAPI.getReceivedRequests()
      ]);

      const validExchanges = [...sent, ...received]
        .filter(isValidExchange)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setExchanges(validExchanges);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch exchanges';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleAction = async (exchangeId: string, action: string) => {
    try {
      let status: ExchangeStatus;
      switch (action) {
        case 'accept': status = 'accepted'; break;
        case 'reject': status = 'rejected'; break;
        case 'withdraw': status = 'cancelled'; break;
        default: throw new Error('Invalid action');
      }

      const response = await exchangeAPI.updateRequestStatus(exchangeId, status);
      setExchanges(prev => prev.map(ex => 
        ex.id === exchangeId ? response : ex
      ));

      enqueueSnackbar(`Exchange request ${action}ed successfully`, { 
        variant: 'success' 
      });

      // Refresh the list after action
      await fetchExchanges();
    } catch (err: any) {
      console.error('Action error:', err);
      enqueueSnackbar(
        err.response?.data?.error || `Failed to ${action} request`,
        { variant: 'error' }
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  const receivedExchanges = exchanges.filter(e => e.owner.id === user.id);
  const sentExchanges = exchanges.filter(e => e.requester.id === user.id);

  return (
    <Box>
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
        <Tab label={`Received (${receivedExchanges.length})`} />
        <Tab label={`Sent (${sentExchanges.length})`} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {receivedExchanges.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
            No exchange requests received
          </Typography>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {receivedExchanges.map(exchange => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                onAction={(action) => handleAction(exchange.id, action)}
                onClick={() => setSelectedExchange(exchange)}
              />
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {sentExchanges.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
            No exchange requests sent
          </Typography>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sentExchanges.map(exchange => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                onAction={(action) => handleAction(exchange.id, action)}
                onClick={() => setSelectedExchange(exchange)}
              />
            ))}
          </Box>
        )}
      </TabPanel>

      {selectedExchange && (
        <ExchangeDetails
          exchange={selectedExchange}
          onUpdate={(updatedExchange) => {
            setExchanges(prev => 
              prev.map(ex => ex.id === updatedExchange.id ? updatedExchange : ex)
            );
            setSelectedExchange(updatedExchange);
          }}
          onClose={() => setSelectedExchange(null)}
        />
      )}
    </Box>
  );
};

export default ExchangeList;