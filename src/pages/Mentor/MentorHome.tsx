import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

interface StudentData {
  id: string;
  email: string;
  displayName?: string;
  address?: string;
  phoneNumber?: string;
  status: string;
  role: string;
  mentorId?: string | null;
  attendancePercentage?: number;
}

interface AttendanceRecord {
  [date: string]: {
    [studentId: string]: boolean;
  };
}

interface AttendanceSettings {
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
}

const MentorHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [openStudentDetailsDialog, setOpenStudentDetailsDialog] = useState(false);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);

  // Fetch attendance settings
  useEffect(() => {
    const fetchSettings = async () => {
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

    fetchSettings();
  }, []);

  // Calculate attendance percentage for a student
  const calculateAttendancePercentage = useCallback(async (studentId: string): Promise<number> => {
    if (!user?.id || !settings) {
      console.log("Missing user ID or settings:", { userId: user?.id, settings });
      return 0;
    }

    try {
      console.log("Calculating attendance for student:", studentId);
      console.log("Using mentor ID:", user.id);
      console.log("Attendance settings:", settings);

      const attendanceDocRef = doc(db, "attendance", user.id);
      const docSnap = await getDoc(attendanceDocRef);
      
      if (!docSnap.exists()) {
        console.log("No attendance document found for mentor:", user.id);
        return 0;
      }
      
      const attendanceData = docSnap.data() as AttendanceRecord;
      console.log("Raw attendance data:", attendanceData);

      let totalDays = 0;
      let presentDays = 0;

      const currentDay = dayjs().startOf('day');
      let iteratorDay = settings.startDate.startOf('day');

      console.log("Date range for calculation:", {
        start: iteratorDay.format('YYYY-MM-DD'),
        end: settings.endDate.format('YYYY-MM-DD'),
        current: currentDay.format('YYYY-MM-DD')
      });

      while (iteratorDay.isSameOrBefore(settings.endDate.endOf('day')) && iteratorDay.isSameOrBefore(currentDay)) {
        const formattedDate = iteratorDay.format('YYYY-MM-DD');
        const dayAttendance = attendanceData[formattedDate];

        if (dayAttendance) { // Only count if attendance was marked for this date (not a holiday)
          totalDays++;
          const isPresent = dayAttendance[studentId] === true;
          if (isPresent) {
            presentDays++;
          }
        }

        console.log(`Date ${formattedDate}:`, {
          isPresent: dayAttendance?.[studentId] === true, // Use dayAttendance for logging
          totalDays,
          presentDays
        });

        iteratorDay = iteratorDay.add(1, 'day');
      }

      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      console.log("DEBUG: Attendance Calculation for student:", studentId, ", Total Days:", totalDays, ", Present Days:", presentDays);
      console.log("Final calculation:", {
        studentId,
        totalDays,
        presentDays,
        percentage
      });

      return percentage;
    } catch (error) {
      console.error("Error calculating attendance percentage:", error);
      return 0;
    }
  }, [user?.id, settings]);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (user && user.role === 'mentor' && user.id) {
        setLoadingStudents(true);
        setError(null);
        try {
          console.log("Fetching students for mentor:", user.id);
          const studentsCollectionRef = collection(db, "users");
          const q = query(studentsCollectionRef, where('role', '==', 'student'), where('mentorId', '==', user.id));
          const querySnapshot = await getDocs(q);
          
          console.log("Found students:", querySnapshot.docs.length);
          
          const studentsList: StudentData[] = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const data = doc.data();
              console.log("Processing student:", doc.id);
              const attendancePercentage = await calculateAttendancePercentage(doc.id);
              console.log("Calculated attendance for student:", doc.id, ":", attendancePercentage);
              
              return {
                id: doc.id,
                email: data.email,
                displayName: data.displayName || 'N/A',
                address: data.address || 'N/A',
                phoneNumber: data.phoneNumber || 'N/A',
                status: data.status || 'N/A',
                role: data.role || 'N/A',
                mentorId: data.mentorId || null,
                attendancePercentage,
              } as StudentData;
            })
          );
          
          console.log("Final students list with attendance:", studentsList);
          setStudents(studentsList);
        } catch (err: any) {
          console.error("Error fetching assigned students:", err);
          toast.error("Failed to load assigned students.");
          setError("Failed to load assigned students.");
        } finally {
          setLoadingStudents(false);
        }
      } else if (!user && !authLoading) {
        navigate('/login');
      }
    };

    fetchAssignedStudents();
  }, [user, authLoading, navigate, settings, calculateAttendancePercentage]);

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

  const handleViewStudentDetails = (student: StudentData) => {
    setSelectedStudent(student);
    setOpenStudentDetailsDialog(true);
  };

  const handleCloseStudentDetailsDialog = () => {
    setOpenStudentDetailsDialog(false);
    setSelectedStudent(null);
  };

  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending_approval':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (authLoading || loadingStudents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'mentor') {
    // Should be caught by ProtectedRoute or useEffect redirect, but as a fallback
    return null;
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
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar 
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'white',
                color: theme.palette.success.main,
                boxShadow: 2
              }}
            >
              <GroupIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Welcome, Mentor!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Here's an overview of your assigned students and attendance.
        </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Mentor Statistics Cards */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        sx={{ mb: 4 }}
        divider={<Box sx={{ width: '1px', bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />}
      >
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <SchoolIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Assigned Students</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{students.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                <PendingIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Students Needing Attention</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {students.filter(s => (s.attendancePercentage || 0) < 80).length}
        </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <AssignmentIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Upcoming Projects</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>0</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      {/* Assigned Students Table */}
      <Paper 
        elevation={0} 
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="assigned students table">
              <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                <TableCell>Student</TableCell>
                  <TableCell>Email</TableCell>
                <TableCell>Attendance</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow 
                    key={student.id}
                          sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: theme.palette.action.hover }
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                          {student.displayName ? student.displayName[0].toUpperCase() : 'S'}
                        </Avatar>
                        <Typography variant="body1" noWrap>
                          {student.displayName || 'N/A'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {student.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${student.attendancePercentage || 0}%`}
                        color={getAttendanceStatusColor(student.attendancePercentage || 0) as any}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewStudentDetails(student)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No students currently assigned to you.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </TableContainer>
      </Paper>

      {/* Student Details Dialog */}
      <Dialog 
        open={openStudentDetailsDialog} 
        onClose={handleCloseStudentDetailsDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          Student Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedStudent && (
            <Box>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main }}>
                    {selectedStudent.displayName ? selectedStudent.displayName[0].toUpperCase() : 'S'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedStudent.displayName || selectedStudent.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Contact Information:</Typography>
                <Stack spacing={1} mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Email:</Typography>
                    <Typography variant="body2">{selectedStudent.email}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Address:</Typography>
                    <Typography variant="body2">{selectedStudent.address || 'N/A'}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Phone:</Typography>
                    <Typography variant="body2">{selectedStudent.phoneNumber || 'N/A'}</Typography>
                  </Stack>
                </Stack>

                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Status:</Typography>
                <Stack spacing={1} mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Account Status:</Typography>
                    <Chip label={selectedStudent.status} size="small" color={getStatusChipColor(selectedStudent.status) as any} sx={{ textTransform: 'capitalize' }} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Role:</Typography>
                    <Chip label={selectedStudent.role} size="small" color="primary" sx={{ textTransform: 'capitalize' }} />
                  </Stack>
                </Stack>

                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Attendance:</Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Percentage:</Typography>
                    <Chip 
                      label={`${selectedStudent.attendancePercentage || 0}%`}
                      color={getAttendanceStatusColor(selectedStudent.attendancePercentage || 0) as any}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={handleCloseStudentDetailsDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MentorHome; 