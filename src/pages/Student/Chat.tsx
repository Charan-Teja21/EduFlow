import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, useTheme, useMediaQuery, Card, CardContent, Avatar, Stack } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import ChatInterface from '../../components/Chat/ChatInterface';

interface Mentor {
  id: string;
  email: string;
  displayName?: string;
}

const StudentChat: React.FC = () => {
  const { user } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchMentor = async () => {
      if (!user?.mentorId) {
        setLoading(false);
        return;
      }

      try {
        const mentorDoc = await getDoc(doc(db, 'users', user.mentorId));
        if (mentorDoc.exists()) {
          const mentorData = mentorDoc.data();
          setMentor({
            id: mentorDoc.id,
            email: mentorData.email,
            displayName: mentorData.displayName || 'Mentor',
          });
        }
      } catch (error) {
        console.error('Error fetching mentor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [user?.mentorId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mentor) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No mentor assigned to you.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      p: { xs: 1, sm: 3 },
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.palette.background.default,
    }}>
      <Card
        elevation={3}
        sx={{ 
          mb: { xs: 1, sm: 3 },
          borderRadius: 2,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.dark, width: 56, height: 56 }}>
              {mentor.displayName ? mentor.displayName[0].toUpperCase() : mentor.email[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
                Chat with {mentor.displayName || "Your Mentor"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Connect and communicate with your mentor.
      </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Paper 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: theme.shadows[6],
        }}
      >
        <ChatInterface
          selectedStudentId={mentor.id}
          selectedStudentName={mentor.displayName || mentor.email}
        />
      </Paper>
    </Box>
  );
};

export default StudentChat; 