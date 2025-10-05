import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { toast } from 'react-toastify';
import { logout } from '../../store/slices/userSlice';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { RootState, AppDispatch } from '../../store';
import { Person as PersonIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, CalendarToday as CalendarTodayIcon } from '@mui/icons-material';

dayjs.extend(isSameOrBefore);

interface AttendanceRecord {
  [date: string]: {
    [studentId: string]: boolean;
  };
}

interface AttendanceSettings {
  startDate: Dayjs;
  endDate: Dayjs;
}

const StudentHome: React.FC = () => {
  const { user, isLoading } = useSelector((state: RootState) => state.user);
  const [attendancePercentage, setAttendancePercentage] = useState<number | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    console.log("StudentHome - useEffect triggered.");
    console.log("  Current User state:", user);
    console.log("  Current isLoading state:", isLoading);

    // If user data is still loading, or if user is not authenticated/not a student, or if mentorId is missing, set error and return.
    if (isLoading || !user || !user.id || user.role !== 'student') {
      if (isLoading) {
        console.log("StudentHome - useEffect: User data still loading. Waiting...");
        setLoadingAttendance(true); // Keep loading true while user data is being fetched
        setError(null); // Clear any previous errors temporarily
      } else if (!user || !user.id || user.role !== 'student') {
        console.log("StudentHome - useEffect: User not authenticated, not a student, or incomplete user data. Setting error and returning.");
        setLoadingAttendance(false);
        setError("Please log in as a student to view your attendance.");
        setAttendancePercentage(null);
      }
      return;
    }

    // Now, if user is a student, and user data is loaded, check for mentorId
    if (!user.mentorId) {
      console.log("StudentHome - useEffect: User is a student, but mentor ID is missing. Setting error and returning.");
      setError("You are not assigned to a mentor yet. Attendance data unavailable.");
      setAttendancePercentage(null);
      setLoadingAttendance(false);
      return;
    }

    // If we reach here, user is authenticated, is a student, has a mentorId, and not loading. Proceed to fetch attendance.
    console.log("StudentHome - useEffect: All conditions met (user, role, mentorId, and not loading), proceeding to fetch attendance.");

    const fetchAttendanceData = async () => {
      console.log("fetchAttendanceData initiated. User at start of fetchAttendanceData:", user);
      setLoadingAttendance(true); // Indicate that attendance data is being fetched
      setError(null); // Clear any previous errors

      try {
        // Fetch attendance settings
        const settingsDocRef = doc(db, "settings", "attendance");
        const settingsDocSnap = await getDoc(settingsDocRef);
        let settings: AttendanceSettings | null = null;
        if (settingsDocSnap.exists()) {
          const data = settingsDocSnap.data();
          settings = {
            startDate: dayjs(data.startDate.toDate()),
            endDate: dayjs(data.endDate.toDate())
          };
        }

        console.log("fetchAttendanceData: Attendance settings:", settings);

        if (!settings) {
          setError("Attendance settings not configured by admin.");
          setLoadingAttendance(false);
          return;
        }

        // Fetch student's attendance record from mentor's attendance document
        console.log("fetchAttendanceData: User mentorId for doc call:", user.mentorId!);
        const attendanceDocRef = doc(db, "attendance", user.mentorId!);
        const attendanceDocSnap = await getDoc(attendanceDocRef);
        const mentorAttendance: AttendanceRecord = attendanceDocSnap.exists() ? attendanceDocSnap.data() as AttendanceRecord : {};

        let totalDays = 0;
        let presentDays = 0;

        const currentDay = dayjs().startOf('day');
        let iteratorDay = settings.startDate.startOf('day');

        while (iteratorDay.isSameOrBefore(settings.endDate.endOf('day')) && iteratorDay.isSameOrBefore(currentDay)) {
          const formattedDate = iteratorDay.format('YYYY-MM-DD');
          totalDays++;

          if (mentorAttendance[formattedDate]?.[user.id] === true) {
            presentDays++;
          }
          iteratorDay = iteratorDay.add(1, 'day');
        }

        if (totalDays > 0) {
          setAttendancePercentage(Math.round((presentDays / totalDays) * 100));
        } else {
          setAttendancePercentage(0);
        }
        console.log(`Attendance calculation: Total days: ${totalDays}, Present days: ${presentDays}, Percentage: ${attendancePercentage}`);

      } catch (err: any) {
        console.error("Error fetching attendance data:", err);
        toast.error("Failed to load attendance data.");
        setError("Failed to load attendance data.");
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendanceData();
  }, [user, isLoading, user?.mentorId, attendancePercentage]);

  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate('/login');
      toast.success("Logged out successfully!");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  if (loadingAttendance) {
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
          background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar
              sx={{
                width: 70,
                height: 70,
                bgcolor: 'white',
                color: theme.palette.success.main,
                boxShadow: 3
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 600 }}>
                Welcome Back, {user?.displayName || user?.email || 'Student'}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Here's a quick overview of your activities and progress.
        </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Attendance Overview Card */}
      <Card elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Your Dashboard
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-around" alignItems="center">
          {/* Attendance Card */}
          <Card sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarTodayIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Attendance</Typography>
          {error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : (attendancePercentage !== null ? (
                <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={attendancePercentage}
                    size={80}
                    thickness={6}
                    sx={{ color: 'white' }}
                  />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                    <Typography variant="h6" component="div" color="inherit" sx={{ fontWeight: 700 }}>{`${attendancePercentage}%`}</Typography>
              </Box>
            </Box>
          ) : (
                <Typography variant="body2" color="inherit">No attendance data available.</Typography>
          ))}
              <Typography variant="body2" color="inherit" sx={{ mt: 2, opacity: 0.9 }}>
                Your attendance percentage for the current period.
              </Typography>
            </CardContent>
          </Card>

          {/* Placeholder for other cards (e.g., Assignments, Grades) */}
        </Stack>

        {error && <Typography color="error" align="center" sx={{ mt: 3 }}>{error}</Typography>}

        {/* Quick Links Section */}
        <Box sx={{ mt: 4, width: '100%' }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Quick Links
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/student/profile')}
              sx={{ flex: 1, py: 1.5, fontSize: '1rem', borderRadius: 2 }}
            >
              My Profile
            </Button>
            <Button
              variant="contained"
              color="info"
              onClick={() => navigate('/student/chat')}
              sx={{ flex: 1, py: 1.5, fontSize: '1rem', borderRadius: 2 }}
            >
              Chat with Mentor
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" color="secondary" onClick={handleLogout} sx={{ py: 1.5, px: 4, fontSize: '1rem' }}>
          Logout
        </Button>
      </Box>
      </Card>
    </Container>
  );
};

export default StudentHome; 