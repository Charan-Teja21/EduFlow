import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, fetchUserProfile } from '../../store/slices/userSlice';
import { User } from '../../store/types';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import bcrypt from 'bcryptjs';
import { AppDispatch } from '../../store';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Check if user exists in Firestore
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErrors({ email: 'User not found. Please register first.' });
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Skip approval check for admin
      if (userData.role !== 'admin' && userData.status !== 'approved') {
        setErrors({ email: 'Your account is pending approval. Please wait for admin approval.' });
        setLoading(false);
        return;
      }

      // Check password using bcrypt
      const match = await bcrypt.compare(password, userData.password);
      if (!match) {
        setErrors({ password: 'Invalid password.' });
        setLoading(false);
        return;
      }

      // Store user data in Redux
      const userToStore: User = {
        id: userDoc.id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
      };
      dispatch(login(userToStore));
      dispatch(fetchUserProfile(userDoc.id));
      toast.success('Login successful!');
      navigate(`/${userData.role.toLowerCase()}/home`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <>
      <Box sx={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1,
        background: `linear-gradient(135deg, #b3c6f7 0%, #e3f0ff 50%, #90caf9 100%)`,
        backgroundSize: '600% 600%',
        animation: 'gradientBG 12s ease infinite',
        '@keyframes gradientBG': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      }} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Container maxWidth="xs">
          <Card elevation={0} sx={{
            borderRadius: 4,
            p: 2,
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 12px 32px 0 rgba(31, 38, 135, 0.22)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
                  <LockOutlinedIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
                  Login
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  type="email"
                  label="Email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="email"
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                />
                <TextField
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="current-password"
                  required
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: 2,
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                    transition: 'background 0.4s, box-shadow 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                      boxShadow: '0 4px 20px 0 rgba(25, 118, 210, 0.25)',
                    },
                  }}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={22} color="inherit" /> : null}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Link to="#" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>
                  Forgot password?
                </Link>
              </Box>
              <Typography variant="body2" align="center" sx={{ mt: 3 }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                  Register here
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export default Login; 