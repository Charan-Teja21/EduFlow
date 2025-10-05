import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import InputAdornment from '@mui/material/InputAdornment';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import bcrypt from 'bcryptjs';

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['#e57373', '#ffb74d', '#fff176', '#64b5f6', '#81c784', '#388e3c'];

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student'); // Default role
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Check if email already exists in Firestore
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setErrors({ email: 'Email already in use. Please use a different email.' });
        setLoading(false);
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Add new user to Firestore
      await addDoc(collection(db, 'users'), {
        email,
        password: hashedPassword,
        role,
        status: 'pending_approval',
        createdAt: new Date().toISOString()
      });

      toast.success('Registration successful! Please wait for admin approval.');
      navigate('/login');
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

  const passwordStrength = getPasswordStrength(password);

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
                  <PersonAddAlt1OutlinedIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
                  Register
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  autoComplete="new-password"
                  required
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                />
                {password && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: -1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(passwordStrength / 5) * 100}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 5,
                        background: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: strengthColors[passwordStrength],
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: strengthColors[passwordStrength], minWidth: 80, textAlign: 'right' }}>
                      {strengthLabels[passwordStrength]}
                    </Typography>
                  </Box>
                )}
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    value={role}
                    label="Role"
                    onChange={(e) => setRole(e.target.value as string)}
                    sx={{ borderRadius: 2 }}
                    disabled={loading}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="mentor">Mentor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
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
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </Box>
              <Typography variant="body2" align="center" sx={{ mt: 3 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                  Login here
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export default Register; 