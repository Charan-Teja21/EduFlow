import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StudentList from '../../components/Chat/StudentList';
import ChatInterface from '../../components/Chat/ChatInterface';

interface Student {
  id: string;
  email: string;
  displayName?: string;
}

const Chat: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentList, setShowStudentList] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    if (isMobile) {
      setShowStudentList(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {isMobile && (
          <IconButton
            onClick={() => setShowStudentList(!showStudentList)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Chat with Students
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100% - 48px)', 
        gap: 2,
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        <Box sx={{ 
          width: { xs: '100%', md: '30%' }, 
          minWidth: { xs: '100%', md: 220 }, 
          maxWidth: { xs: '100%', md: 350 }, 
          height: { xs: showStudentList ? '300px' : 0, md: '100%' },
          display: { xs: showStudentList ? 'block' : 'none', md: 'block' },
          transition: 'height 0.3s ease-in-out',
          overflow: 'hidden'
        }}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <StudentList
              onSelectStudent={handleSelectStudent}
              selectedStudentId={selectedStudent?.id}
            />
          </Paper>
        </Box>
        <Box sx={{ 
          flex: 1, 
          height: { xs: showStudentList ? 'calc(100% - 300px)' : '100%', md: '100%' },
          transition: 'height 0.3s ease-in-out'
        }}>
          <Paper sx={{ height: '100%' }}>
            <ChatInterface
              selectedStudentId={selectedStudent?.id}
              selectedStudentName={selectedStudent?.displayName || selectedStudent?.email}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat; 