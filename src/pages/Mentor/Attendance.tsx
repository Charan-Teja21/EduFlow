import React, { useState, useEffect, useMemo, ComponentProps } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
  useTheme,
  Avatar,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const StyledCalendar = styled(Calendar)(({ theme }) => ({
  border: 'none !important',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif !important',
  width: '100% !important',
  maxWidth: '400px !important',
  '& .react-calendar__navigation button': {
    minWidth: '44px !important',
    background: 'none !important',
    fontSize: '1rem !important',
    color: theme.palette.text.primary + ' !important',
  },
  '& .react-calendar__navigation button:enabled:hover, & .react-calendar__navigation button:enabled:focus': {
    backgroundColor: theme.palette.action.hover + ' !important',
    borderRadius: theme.shape.borderRadius + 'px !important',
  },
  '& .react-calendar__month-view__weekdays__weekday': {
    fontSize: '0.875rem !important',
    color: theme.palette.text.secondary + ' !important',
    textDecoration: 'none !important',
  },
  '& .react-calendar__month-view__weekdays abbr': {
    textDecoration: 'none !important',
    fontWeight: '500 !important',
  },
  '& .react-calendar__tile': {
    maxWidth: '100% !important',
    padding: '8px 0 !important',
    background: 'none !important',
    borderRadius: theme.shape.borderRadius + 'px !important',
    color: theme.palette.text.primary + ' !important',
  },
  '& .react-calendar__tile:enabled:hover, & .react-calendar__tile:enabled:focus': {
    backgroundColor: theme.palette.action.hover + ' !important',
  },
  '& .react-calendar__tile--now': {
    background: theme.palette.action.selected + ' !important',
    color: theme.palette.primary.main + ' !important',
    fontWeight: '600 !important',
  },
  '& .react-calendar__tile--active': {
    backgroundColor: theme.palette.primary.main + ' !important',
    color: theme.palette.primary.contrastText + ' !important',
    fontWeight: '600 !important',
  },
  '& .react-calendar__tile--disabled': {
    backgroundColor: theme.palette.action.disabledBackground + ' !important',
    color: theme.palette.action.disabled + ' !important',
    opacity: '0.7 !important',
  },
  '& .react-calendar__tile--all-present': {
    backgroundColor: theme.palette.success.light + ' !important',
    color: theme.palette.success.dark + ' !important',
  },
  '& .react-calendar__tile--some-present': {
    backgroundColor: theme.palette.warning.light + ' !important',
    color: theme.palette.warning.dark + ' !important',
  },
  '& .react-calendar__tile--all-absent': {
    backgroundColor: theme.palette.error.light + ' !important',
    color: theme.palette.error.dark + ' !important',
  },
  '& .react-calendar__tile--future-in-range': {
    backgroundColor: theme.palette.info.light + ' !important',
    color: theme.palette.info.dark + ' !important',
    fontStyle: 'italic !important',
  },
}));

interface StudentData {
  id: string;
  email: string;
  displayName?: string;
}

interface AttendanceRecord {
  [date: string]: {
    [studentId: string]: boolean;
  };
}

interface AttendanceSettings {
  startDate: Dayjs;
  endDate: Dayjs;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [attendanceMarkedForToday, setAttendanceMarkedForToday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [pendingAttendance, setPendingAttendance] = useState<{[studentId: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = useMemo(() => currentDate.format('YYYY-MM-DD'), [currentDate]);

  const isToday = currentDate.isSame(dayjs().startOf('day'));

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "attendance"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const fetchedSettings = {
            startDate: dayjs(data.startDate.toDate()),
            endDate: dayjs(data.endDate.toDate())
          };
          setSettings(fetchedSettings);
        }
      } catch (error) {
        console.error("Error fetching attendance settings:", error);
        toast.error("Failed to load attendance settings");
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (user && user.role === 'mentor' && user.id) {
        setLoadingStudents(true);
        setError(null);
        try {
          const studentsCollectionRef = collection(db, "users");
          const q = query(studentsCollectionRef, where('role', '==', 'student'), where('mentorId', '==', user.id));
          const querySnapshot = await getDocs(q);
          const studentsList: StudentData[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              displayName: data.displayName || 'N/A',
            } as StudentData;
          });
          setStudents(studentsList);
        } catch (err: any) {
          console.error("Error fetching assigned students:", err);
          toast.error("Failed to load assigned students.");
          setError("Failed to load assigned students.");
        } finally {
          setLoadingStudents(false);
        }
      }
    };

    fetchAssignedStudents();
  }, [user]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (user && user.id) {
        try {
          const attendanceDocRef = doc(db, "attendance", user.id);
          const docSnap = await getDoc(attendanceDocRef);
          if (docSnap.exists()) {
            const attendanceData = docSnap.data() as AttendanceRecord;
            setAttendance(attendanceData);
            
            // Check if attendance is already marked for the current selected date
            const currentDayAttendance = attendanceData[formattedDate];
            const isAttendanceMarked = !!currentDayAttendance;
            setAttendanceMarkedForToday(isAttendanceMarked);

            // For past dates, populate pendingAttendance to show existing marks
            if (!currentDate.isSame(dayjs().startOf('day')) && isAttendanceMarked) {
              setPendingAttendance(currentDayAttendance);
            } else if (currentDate.isSame(dayjs().startOf('day')) && !isAttendanceMarked) {
              // If it's today and not marked yet, clear pending attendance
              setPendingAttendance({});
            } else if (!isAttendanceMarked) {
              // For past/future dates with no attendance, clear pending
              setPendingAttendance({});
            }

          } else {
            setAttendance({}); // No attendance document, clear state
            setAttendanceMarkedForToday(false);
            setPendingAttendance({});
          }
        } catch (err: any) {
          console.error("Error fetching attendance:", err);
          toast.error("Failed to load attendance records.");
          setAttendanceMarkedForToday(false);
          setPendingAttendance({});
        }
      }
    };

    fetchAttendance();
  }, [user, formattedDate, currentDate]);

  const isWithinAttendanceWindow = () => {
    if (!settings) {
      return false;
    }
    const now = dayjs().startOf('day');
    // Check only the date part, ignoring time
    const withinWindow = now.isSameOrAfter(settings.startDate.startOf('day')) && 
                         now.isSameOrBefore(settings.endDate.startOf('day'));
    return withinWindow;
  };

  const isDateDisabled = ({ date }: { date: Date }) => {
    if (!settings) {
      return true;
    }
    const today = dayjs().startOf('day');
    const checkDate = dayjs(date).startOf('day');
    
    // Disable future dates
    if (checkDate.isAfter(today)) {
      return true;
    }
    
    // Disable dates before start date
    if (checkDate.isBefore(settings.startDate.startOf('day'))) {
      return true;
    }
    
    // Disable dates after end date
    if (checkDate.isAfter(settings.endDate.endOf('day'))) {
      return true;
    }
    
    return false;
  };

  const handleDateClick: ComponentProps<typeof Calendar>['onChange'] = (value, event) => {
    // Ensure value is a single Date object, not an array or null
    if (value instanceof Date && !Array.isArray(value)) {
      const clickedDay = dayjs(value).startOf('day');
      setCurrentDate(clickedDay);
    }
    // Otherwise, ignore arrays (range selection) or null values
  };

  const handleMarkAttendance = (studentId: string, present: boolean) => {
    // This function now only handles marking for the *currently selected date*.
    // It will only be called for the current day's attendance marking.
    if (!isToday) {
      toast.error("You can only mark attendance for today.");
      return;
    }

    if (!isWithinAttendanceWindow()) {
      toast.error("Attendance marking is not allowed at this time.");
      return;
    }

    setPendingAttendance(prev => ({
      ...prev,
      [studentId]: present
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!user || !user.id) {
      toast.error("Mentor not logged in.");
      return;
    }

    if (!isToday) {
      toast.error("Attendance can only be submitted for today.");
      return;
    }

    if (!isWithinAttendanceWindow()) {
      toast.error("Attendance marking is not allowed at this time.");
      return;
    }

    if (Object.keys(pendingAttendance).length === 0) {
      toast.warning("No attendance changes to submit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newAttendance = { ...attendance };
      if (!newAttendance[formattedDate]) {
        newAttendance[formattedDate] = {};
      }

      // Update attendance with all pending changes
      Object.entries(pendingAttendance).forEach(([studentId, present]) => {
        newAttendance[formattedDate][studentId] = present;
      });

      const attendanceDocRef = doc(db, "attendance", user.id);
      await setDoc(attendanceDocRef, newAttendance, { merge: true });
      setAttendance(newAttendance);
      setPendingAttendance({});
      setAttendanceMarkedForToday(true);
      toast.success("Attendance submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting attendance:", err);
      toast.error("Failed to submit attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const tileDate = dayjs(date).format('YYYY-MM-DD');
      const dayAttendance = attendance[tileDate];

      const checkDate = dayjs(date).startOf('day');
      const today = dayjs().startOf('day');

      const isDisabledByIsDateDisabled = isDateDisabled({ date });

      if (isDisabledByIsDateDisabled) {
        // If it's disabled, but it's a future date within range, apply the special class
        if (settings && checkDate.isAfter(today) && 
            checkDate.isSameOrAfter(settings.startDate.startOf('day')) && 
            checkDate.isSameOrBefore(settings.endDate.endOf('day'))) {
          return 'react-calendar__tile--future-in-range';
        }
        // Otherwise, if it's disabled, return the default disabled class name
        return 'react-calendar__tile--disabled';
      }

      // If it's a past date and no attendance data exists, consider it a holiday
      if (checkDate.isBefore(today) && !dayAttendance) {
        return 'react-calendar__tile--disabled';
      }

      // Only apply attendance-based styling for past or current dates
      if (checkDate.isSameOrBefore(today) && dayAttendance) {
        const allPresent = students.every(student => dayAttendance[student.id] === true);
        const anyPresent = students.some(student => dayAttendance[student.id] === true);

        if (allPresent) {
          return 'react-calendar__tile--all-present';
        }
        if (anyPresent) {
          return 'react-calendar__tile--some-present';
        }
        
        // If there's attendance for the day, but not all are present and no one is present
        const allAbsentOrNotMarked = students.every(student => dayAttendance[student.id] === false || dayAttendance[student.id] === undefined);
        if (allAbsentOrNotMarked) {
          return 'react-calendar__tile--all-absent';
        }

      }
      // Default for dates with no attendance or future dates not within range
      return null;
    }
    return null;
  };

  const totalStudentsAssigned = students.length;
  const studentsPresentToday = Object.values(pendingAttendance).filter(p => p === true).length;
  const studentsAbsentToday = Object.values(pendingAttendance).filter(p => p === false).length;
  const studentsNotMarkedToday = totalStudentsAssigned - studentsPresentToday - studentsAbsentToday;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Mentor Attendance
      </Typography>

      {/* Attendance Summary Cards */}
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
                <GroupIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Assigned Students</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{totalStudentsAssigned}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <CheckCircleIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Present Today</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{studentsPresentToday}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <CancelIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Absent Today</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{studentsAbsentToday}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Calendar and Mark Attendance Sections */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Calendar Section */}
        <Card 
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon color="primary" /> Attendance Calendar
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', p: 2 }}>
              <StyledCalendar
            onChange={handleDateClick}
            value={currentDate.toDate()}
            tileClassName={tileClassName}
            tileDisabled={isDateDisabled}
          />
        </Box>
          </CardContent>
        </Card>

        {/* Mark Attendance Section */}
        <Paper 
          elevation={0} 
          sx={{
            flex: 1.5,
            minWidth: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Mark Attendance for {currentDate.format('ddd MMM D YYYY')}
        </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
        {!isToday && !attendance[formattedDate] && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No attendance data found for {currentDate.format('MMM D, YYYY')}.
          </Alert>
        )}

        {attendanceMarkedForToday && isToday && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Attendance for today has already been marked.
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loadingStudents ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <CircularProgress />
          </Box>
        ) : students.length > 0 ? (
              <Stack spacing={2}>
                {students.map((student) => {
                  const isStudentPresent = isToday 
                    ? (pendingAttendance[student.id] === true) 
                    : (attendance[formattedDate]?.[student.id] === true);
                  
                  const isStudentAbsent = isToday
                    ? (pendingAttendance[student.id] === false)
                    : (attendance[formattedDate]?.[student.id] === false);

                  let statusLabel = 'Not Marked';
                  let statusColor: 'default' | 'success' | 'error' | 'warning' = 'default';
                  let statusIcon = <AccessTimeIcon fontSize="small" />;

                  if (isStudentPresent) {
                    statusLabel = 'Present';
                    statusColor = 'success';
                    statusIcon = <CheckCircleIcon fontSize="small" />;
                  } else if (isStudentAbsent) {
                    statusLabel = 'Absent';
                    statusColor = 'error';
                    statusIcon = <CancelIcon fontSize="small" />;
                  }
                  
                  const switchDisabled = !isToday || attendanceMarkedForToday || !isWithinAttendanceWindow();

                  return (
                    <Card 
                      key={student.id} 
                      elevation={2}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        '&:hover': { boxShadow: theme.shadows[4] },
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                          {/* Left side: Student Info */}
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                              {student.displayName ? student.displayName[0].toUpperCase() : 'S'}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>{student.displayName}</Typography>
                              <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                            </Box>
                          </Stack>

                          {/* Right side: Status and Switch */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip 
                              label={statusLabel} 
                              color={statusColor} 
                              icon={statusIcon}
                              size="small"
                              sx={{ minWidth: 90 }}
                            />
                            <Switch
                        checked={isToday ? (pendingAttendance[student.id] === true) : (attendance[formattedDate]?.[student.id] === true)}
                              onChange={(e) => handleMarkAttendance(student.id, e.target.checked)}
                        disabled={!isToday || attendanceMarkedForToday || !isWithinAttendanceWindow()}
                        color="primary"
                      />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                No students currently assigned to you.
              </Typography>
            )}
            {isToday && !attendanceMarkedForToday && isWithinAttendanceWindow() && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${theme.palette.divider}`, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting || Object.keys(pendingAttendance).length === 0}
                  startIcon={<CheckCircleIcon />}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Attendance'}
                </Button>
              </Box>
            )}
          </Box>
      </Paper>
      </Stack>
    </Container>
  );
};

export default Attendance; 