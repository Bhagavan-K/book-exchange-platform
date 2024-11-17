import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Button,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { userAPI } from '../../services/api';
import UserBooks from './UserBooks';
import ExchangeRequests from '../exchange/ExchangeRequests';
import EditProfile from './EditProfile';
import DeleteAccountDialog from './DeleteAccountDialog';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User } from '../../types/models';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface UserStats {
  totalBooks: number;
  activeExchanges: number;
  completedExchanges: number;
  reputation: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const UserProfile = () => {
  const { user, updateUser, refreshUserData } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalBooks: 0,
    activeExchanges: 0,
    completedExchanges: 0,
    reputation: 0,
  });
  const [tabValue, setTabValue] = useState(() => {
    return (routerLocation.state as { activeTab?: number })?.activeTab || 0;
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserStats();
      setStats({
        totalBooks: response.totalBooks,
        activeExchanges: response.activeExchanges,
        completedExchanges: response.completedExchanges,
        reputation: response.reputation
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStats({
        totalBooks: 0,
        activeExchanges: 0,
        completedExchanges: 0,
        reputation: 0
      });
      enqueueSnackbar(error.response?.data?.error || 'Failed to fetch user stats', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats, user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await userAPI.updateProfileImage(formData);
      if (user) {
        await updateUser({
          ...user,
          profileImage: response.profileImage
        });
      }
      enqueueSnackbar('Profile image updated successfully', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to update profile image', {
        variant: 'error',
      });
    }
  };

  const handleClose = useCallback(() => {
    setEditProfileOpen(false);
    refreshUserData();
  }, [refreshUserData]);


  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Box position="relative">
                <Avatar
                  src={user.profileImage}
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    bgcolor: 'primary.main',
                  }}
                >
                  {!user.profileImage && <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: -8,
                    backgroundColor: 'background.paper',
                  }}
                  component="label"
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <PhotoCameraIcon />
                </IconButton>
              </Box>

              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditProfileOpen(true)}
                sx={{ mt: 1 }}
              >
                Edit Profile
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4} textAlign="center">
                  <Typography variant="h4">{stats.totalBooks}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Books
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="center">
                  <Typography variant="h4">{stats.activeExchanges}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="center">
                  <Typography variant="h4">{stats.completedExchanges}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Preferred Genres
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {user.preferences.genres.length > 0 ? (
                  user.preferences.genres.map((genre: string) => (
                    <Chip key={genre} label={genre} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No preferences set
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 3 }} />
              <Button
                color="error"
                variant="outlined"
                onClick={() => setDeleteAccountOpen(true)}
                startIcon={<DeleteIcon />}
                fullWidth
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="My Books" />
              <Tab label="Exchange Requests" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <UserBooks />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <ExchangeRequests />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <EditProfile
        open={editProfileOpen}
        onClose={handleClose}
        currentUser={user}
      />

      <DeleteAccountDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
      />
    </Container>
  );
};

export default UserProfile;