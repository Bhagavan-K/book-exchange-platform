import {
  Box,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export const genres = [
  'All',
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

export const conditions = [
  'All',
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
];

export const sortOptions = [
  { value: 'recommended', label: 'Recommended For You' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' }
];

interface FilterValues {
  search: string;
  genre: string;
  condition: string;
  location: string;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: FilterValues;
  onFilterChange: (name: string, value: string) => void;
}

const SearchFilters = ({ filters, onFilterChange }: SearchFiltersProps) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Search Books"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search by title or author..."
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            label="Genre"
            value={filters.genre}
            onChange={(e) => onFilterChange('genre', e.target.value)}
            size="small"
          >
            {genres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            label="Condition"
            value={filters.condition}
            onChange={(e) => onFilterChange('condition', e.target.value)}
            size="small"
          >
            {conditions.map((condition) => (
              <MenuItem key={condition} value={condition}>
                {condition}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            select
            label="Sort By"
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            size="small"
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchFilters;