import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Stack,
  Alert,
  Card,
  CardContent,
  IconButton,
  useTheme,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';

interface AttendanceSettings {
  startDate: Dayjs;
  endDate: Dayjs;
}

const AdminHome: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMentors: 0,
    totalProjects: 0
  });
  const [settings, setSettings] = useState<AttendanceSettings>({
    startDate: dayjs(),
    endDate: dayjs()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAttendanceSettings();
  }, []);

    const fetchStats = async () => {
      try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);
      const users = querySnapshot.docs.map(doc => doc.data());

        setStats({
        totalStudents: users.filter(user => user.role === 'student').length,
        totalMentors: users.filter(user => user.role === 'mentor').length,
        totalProjects: 0
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

  const fetchAttendanceSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "attendance"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({
          startDate: dayjs(data.startDate.toDate()),
          endDate: dayjs(data.endDate.toDate())
        });
      }
    } catch (error) {
      console.error("Error fetching attendance settings:", error);
      toast.error("Failed to load attendance settings");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "attendance"), {
        startDate: settings.startDate.toDate(),
        endDate: settings.endDate.toDate()
      });
      toast.success("Attendance settings saved successfully!");
    } catch (error) {
      console.error("Error saving attendance settings:", error);
      toast.error("Failed to save attendance settings");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Welcome Section */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
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
                color: theme.palette.primary.main,
                boxShadow: 2
              }}
            >
              <GroupIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Welcome to Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your students, mentors, and attendance settings from here
        </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        sx={{ mb: 4 }}
        divider={<Box sx={{ width: '1px', bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />}
      >
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SchoolIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Students</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.totalStudents}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <GroupIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Mentors</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.totalMentors}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <AssignmentIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Projects</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{stats.totalProjects}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Quick Actions and Attendance Settings */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Quick Actions */}
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" /> Quick Actions
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                fullWidth
                onClick={() => window.location.href = '/admin/users'}
              >
                Manage Users
              </Button>
              <Button
                variant="outlined"
                startIcon={<SchoolIcon />}
                fullWidth
                onClick={() => window.location.href = '/admin/students'}
              >
                View Students
              </Button>
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                fullWidth
                onClick={() => window.location.href = '/admin/mentors'}
              >
                View Mentors
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Attendance Settings */}
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" /> Attendance Settings
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Set the time range during which mentors can mark attendance for their students.
          </Alert>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={3}>
                <Box>
                <DateTimePicker
                  label="Attendance Start Date & Time"
                  value={settings.startDate}
                  onChange={(newValue: Dayjs | null) => {
                    if (newValue) {
                        setSettings(prev => ({ ...prev, startDate: newValue.startOf('day') }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
                <Box>
                <DateTimePicker
                  label="Attendance End Date & Time"
                  value={settings.endDate}
                  onChange={(newValue: Dayjs | null) => {
                    if (newValue) {
                        setSettings(prev => ({ ...prev, endDate: newValue.endOf('day') }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDateTime={settings.startDate}
                />
              </Box>
            </Stack>
          </LocalizationProvider>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveSettings}
              disabled={loading}
                startIcon={<CheckCircleIcon />}
            >
              Save Settings
            </Button>
          </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Recent Activity */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon color="primary" /> Recent Activity
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <CheckCircleIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">New student registration approved</Typography>
                <Typography variant="body2" color="text.secondary">2 minutes ago</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <WarningIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1">Attendance window closing soon</Typography>
                <Typography variant="body2" color="text.secondary">1 hour ago</Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminHome; 