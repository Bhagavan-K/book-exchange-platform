import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import theme from './theme';

import Navbar from './components/layout/Navbar';
import BookList from './components/books/BookList';
import AddBook from './components/books/AddBook';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserProfile from './components/profile/UserProfile';
import PrivateRoute from './components/routing/PrivateRoute';

import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import SecurityQuestions from './components/auth/SecurityQuestions';
import ForgotPassword from './components/auth/ForgotPassword';
import ExchangeList from './components/exchange/ExchangeList';

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <SnackbarProvider maxSnack={3}>
          <Router>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Navbar />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/security" element={<SecurityQuestions />} />
                
                {/* Private Routes */}
                <Route path="/" element={
                  <PrivateRoute>
                    <BookList />
                  </PrivateRoute>
                } />
                <Route path="/books" element={
                  <PrivateRoute>
                    <BookList />
                  </PrivateRoute>
                } />
                <Route path="/add-book" element={
                  <PrivateRoute>
                    <AddBook />
                  </PrivateRoute>
                } />
                  <Route path="/exchanges" element={
                  <PrivateRoute>
                    <ExchangeList />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                } />
              </Routes>
            </ThemeProvider>
          </Router>
        </SnackbarProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;