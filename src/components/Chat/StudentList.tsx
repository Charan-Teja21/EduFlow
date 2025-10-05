import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Badge,
} from '@mui/material';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';

interface Student {
  id: string;
  email: string;
  displayName?: string;
  unreadCount?: number;
}

interface StudentListProps {
  onSelectStudent: (student: Student) => void;
  selectedStudentId?: string;
}

const StudentList: React.FC<StudentListProps> = ({ onSelectStudent, selectedStudentId }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'mentor') return;

    setLoading(true);
    const studentsRef = collection(db, 'users');
    const q = query(studentsRef, where('role', '==', 'student'), where('mentorId', '==', user.id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const studentsList: Student[] = [];
      
      for (const doc of snapshot.docs) {
        const studentData = doc.data();
        const student: Student = {
          id: doc.id,
          email: studentData.email,
          displayName: studentData.displayName || studentData.email,
        };

        // Get unread message count
        const chatId = [user.id, doc.id].sort().join('_');
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('senderId', '==', doc.id),
          where('read', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        student.unreadCount = unreadSnapshot.size;

        studentsList.push(student);
      }

      setStudents(studentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {students.map((student) => (
        <ListItem
          key={student.id}
          disablePadding
          sx={{
            bgcolor: selectedStudentId === student.id ? 'action.selected' : 'inherit',
          }}
        >
          <ListItemButton onClick={() => onSelectStudent(student)}>
            <ListItemAvatar>
              <Badge
                badgeContent={student.unreadCount}
                color="error"
                invisible={!student.unreadCount}
              >
                <Avatar>{student.displayName?.[0] || student.email[0]}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={student.displayName || student.email}
              secondary={student.email}
            />
          </ListItemButton>
        </ListItem>
      ))}
      {students.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No students assigned
          </Typography>
        </Box>
      )}
    </List>
  );
};

export default StudentList; 