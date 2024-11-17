import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Grid,
  CircularProgress,
  Typography,
  MenuItem
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { BookLocation, User } from '../../types/models';
import { useSnackbar } from 'notistack';
import { userAPI } from '../../services/api';
import { INDIAN_CITIES } from '../books/BookList';
import { useAuth } from '../../context/AuthContext';

interface EditProfileProps {
  open: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const genres = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Science Fiction',
  'Fantasy',
  'Romance',
  'Thriller',
  'Horror',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Self-Help'
];

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  bio: Yup.string()
    .max(500, 'Bio must be at most 500 characters'),
  location: Yup.string()
    .required('Location is required'),
  preferredGenres: Yup.array().of(Yup.string()),
  currentPassword: Yup.string(),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
});

const EditProfile = ({ open, onClose, currentUser }: EditProfileProps) => {
  const { updateUser, refreshUserData } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      bio: currentUser?.bio || '',
      location: currentUser?.location || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      preferredGenres: currentUser?.preferences?.genres || []
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        setError(null);

        const updateData = {
          name: values.name,
          bio: values.bio || undefined,
          location: values.location as BookLocation,
          preferences: {
            genres: values.preferredGenres
          }
        };

        await updateUser(updateData);

        if (values.newPassword && values.currentPassword) {
          await userAPI.updatePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          });
        }

        await refreshUserData();

        enqueueSnackbar('Profile updated successfully', { variant: 'success' });
        handleClose();
      } catch (err: any) {
        console.error('Profile update error:', err);
        const errorMsg = err.response?.data?.error || 'Failed to update profile';
        setError(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleClose = () => {
    formik.resetForm();
    setError(null);
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                id="bio"
                name="bio"
                label="Bio"
                value={formik.values.bio}
                onChange={formik.handleChange}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={formik.touched.bio && formik.errors.bio}
                disabled={isSubmitting}
              />
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
              <Typography variant="h6" gutterBottom>Reading Preferences</Typography>
              <TextField
                fullWidth
                select
                SelectProps={{ multiple: true }}
                id="preferredGenres"
                name="preferredGenres"
                label="Preferred Genres"
                value={formik.values.preferredGenres}
                onChange={formik.handleChange}
                error={formik.touched.preferredGenres && Boolean(formik.errors.preferredGenres)}
                helperText={formik.touched.preferredGenres && formik.errors.preferredGenres}
                disabled={isSubmitting}
              >
                {genres.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Change Password (Optional)</Typography>
              <TextField
                fullWidth
                type="password"
                id="currentPassword"
                name="currentPassword"
                label="Current Password"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
                helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                disabled={isSubmitting}
              />
            </Grid>

            {formik.values.currentPassword && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                    helperText={formik.touched.newPassword && formik.errors.newPassword}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    disabled={isSubmitting}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isSubmitting || !formik.isValid}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfile;

