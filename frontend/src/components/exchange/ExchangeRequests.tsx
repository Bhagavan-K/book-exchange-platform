import { useState, useEffect, useCallback } from 'react';
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
  Tab} from '@mui/material';
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

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exchange-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const getStatusColor = (status: ExchangeStatus) => {
  switch (status) {
    case 'accepted': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    case 'modified': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const ExchangeCard = ({ exchange, onClick }: { exchange: Exchange; onClick: () => void }) => {
  const { user } = useAuth();
  const isRequester = exchange.requester.id === user?.id;

  return (
    <Card
      sx={{ 
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' }
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
              {isRequester ? `To: ${exchange.owner.name}` : `From: ${exchange.requester.name}`}
            </Typography>
            {exchange.terms.deliveryMethod && (
              <Typography variant="body2" color="text.secondary">
                Delivery: {exchange.terms.deliveryMethod}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Chip 
              label={exchange.status} 
              color={getStatusColor(exchange.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              {new Date(exchange.createdAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const ExchangeRequests = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Exchange[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Exchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sent, received] = await Promise.all([
        exchangeAPI.getMyRequests(),
        exchangeAPI.getReceivedRequests()
      ]);

      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch requests';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleExchangeUpdate = (updatedExchange: Exchange) => {
    if (updatedExchange.requester.id === updatedExchange.owner.id) {
      setSentRequests(prev => 
        prev.map(req => req.id === updatedExchange.id ? updatedExchange : req)
      );
    } else {
      setReceivedRequests(prev => 
        prev.map(req => req.id === updatedExchange.id ? updatedExchange : req)
      );
    }
    setSelectedExchange(updatedExchange);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (selectedExchange) {
    return (
      <Box>
        <Button 
          onClick={() => setSelectedExchange(null)} 
          sx={{ mb: 2 }}
        >
          Back to List
        </Button>
        <ExchangeDetails
          exchange={selectedExchange}
          onUpdate={handleExchangeUpdate}
          onClose={() => setSelectedExchange(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
        <Tab label={`Received (${receivedRequests.length})`} />
        <Tab label={`Sent (${sentRequests.length})`} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {receivedRequests.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No exchange requests received
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {receivedRequests.map(exchange => (
              <Grid item xs={12} key={exchange.id}>
                <ExchangeCard
                  exchange={exchange}
                  onClick={() => setSelectedExchange(exchange)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {sentRequests.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No exchange requests sent
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {sentRequests.map(exchange => (
              <Grid item xs={12} key={exchange.id}>
                <ExchangeCard
                  exchange={exchange}
                  onClick={() => setSelectedExchange(exchange)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
    </Box>
  );
};

export default ExchangeRequests;