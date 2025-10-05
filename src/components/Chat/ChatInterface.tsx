import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  CircularProgress,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
}

interface ChatInterfaceProps {
  selectedStudentId?: string;
  selectedStudentName?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedStudentId, selectedStudentName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!selectedStudentId || !user) return;

    setLoading(true);
    const chatId = [user.id, selectedStudentId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messageList);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedStudentId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId || !user) return;

    const chatId = [user.id, selectedStudentId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    try {
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.id,
        senderName: user.displayName || user.email,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!selectedStudentId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a student to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ 
        p: { xs: 1, sm: 2 }, 
        backgroundColor: 'primary.main', 
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Chat with {selectedStudentName}
        </Typography>
      </Paper>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: { xs: 1, sm: 2 },
        backgroundColor: '#f5f5f5'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: message.senderId === user?.id ? 'row-reverse' : 'row',
                  gap: 1.5,
                  px: { xs: 1, sm: 2 },
                  py: 1,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar 
                  sx={{ 
                    width: { xs: 36, sm: 44 },
                    height: { xs: 36, sm: 44 },
                    bgcolor: message.senderId === user?.id ? theme.palette.primary.light : theme.palette.grey[300],
                    color: message.senderId === user?.id ? theme.palette.primary.dark : theme.palette.grey[800],
                    mt: 0.5,
                  }}
                >
                  {message.senderName[0].toUpperCase()}
                </Avatar>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                  maxWidth: { xs: '80%', sm: '70%' },
                }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mb: 0.5,
                      mr: message.senderId === user?.id ? 0 : 'auto',
                      ml: message.senderId === user?.id ? 'auto' : 0,
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    {message.senderId === user?.id ? "You" : message.senderName}
                  </Typography>
                <Paper
                  sx={{
                      p: { xs: 1.2, sm: 1.8 },
                      backgroundColor: message.senderId === user?.id ? theme.palette.primary.main : theme.palette.background.paper,
                      color: message.senderId === user?.id ? 'white' : theme.palette.text.primary,
                      borderRadius: message.senderId === user?.id ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                      boxShadow: theme.shadows[2],
                      wordBreak: 'break-word',
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    {message.text}
                  </Typography>
                  <Typography 
                    variant="caption" 
                      color="inherit"
                    sx={{ 
                      display: 'block',
                        mt: 0.8,
                        opacity: 0.8,
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        textAlign: message.senderId === user?.id ? 'right' : 'left',
                    }}
                  >
                    {message.timestamp ? format(message.timestamp.toDate(), 'MMM d, h:mm a') : 'Sending...'}
                  </Typography>
                </Paper>
                </Box>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      <Box 
        component="form" 
        onSubmit={handleSendMessage} 
        sx={{ 
          p: { xs: 1.5, sm: 2.5 },
          borderTop: 1, 
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
          position: 'sticky',
          bottom: 0,
          boxShadow: theme.shadows[5],
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="medium"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '25px',
              },
              '& fieldset': {
                borderColor: theme.palette.divider,
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!newMessage.trim()}
            disableElevation
            sx={{
              borderRadius: '50px',
              minWidth: 'auto',
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              p: 0,
              boxShadow: 'none',
              backgroundColor: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.dark, boxShadow: 'none' },
              '&.Mui-disabled': { backgroundColor: theme.palette.action.disabledBackground, color: theme.palette.action.disabled },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              outline: 'none',
              border: 'none',
            }}
          >
            <SendIcon sx={{ fontSize: { xs: '1.6rem', sm: '2rem' }, color: 'white' }} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface; 