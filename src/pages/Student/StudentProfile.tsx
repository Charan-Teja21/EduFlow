import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';

const StudentProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user && user.id) {
        setProfileLoading(true);
        setError(null);
        try {
          const userDocRef = doc(db, "users", user.id);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setDisplayName(userData.displayName || '');
            setAddress(userData.address || '');
            setPhoneNumber(userData.phoneNumber || '');
          } else {
            console.log("No additional user profile found in Firestore.");
          }
        } catch (err: any) {
          console.error("Error fetching user info:", err);
          toast.error("Failed to load user information.");
          setError("Failed to load user information.");
        }
        setProfileLoading(false);
      } else if (!user && !authLoading) {
        navigate('/login');
      }
    };

    fetchProfileData();
  }, [user, authLoading, navigate]);

  const handleUpdateProfile = async () => {
    if (!user || !user.id) {
      setError("No user logged in.");
      toast.error("No user logged in.");
      return;
    }

    setProfileLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        displayName: displayName,
        address: address,
        phoneNumber: phoneNumber,
      });
      toast.success("Profile updated successfully!");
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating user info:", err);
      toast.error("Failed to update profile.");
      setError("Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      dispatch(logout());
      navigate('/login');
      toast.success("Logged out successfully!");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Welcome Section */}
      <Card 
        elevation={0}
        sx={{
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar 
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'white',
                color: theme.palette.info.main,
                boxShadow: 2
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Hello, Student!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your profile settings here.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Personal Information
        </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
          Logout
        </Button>
      </Box>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {success && <Typography color="success" sx={{ mb: 2 }}>{success}</Typography>}
        
        <Stack spacing={3}>
          <TextField
            label="Display Name"
            variant="outlined"
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            InputProps={{
              startAdornment: (
                <PersonIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
          <TextField
            label="Address"
            variant="outlined"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            InputProps={{
              startAdornment: (
                <LocationOnIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            InputProps={{
              startAdornment: (
                <PhoneIcon color="action" sx={{ mr: 1 }} />
              ),
            }}
          />
          <Button 
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={profileLoading}
            startIcon={<EditIcon />}
            sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
          >
            Update Profile
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default StudentProfile; 