import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MentorSidebarProps {
  isExpanded: boolean;
}

const MentorSidebar: React.FC<MentorSidebarProps> = ({ isExpanded }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/mentor/home' },
    { text: 'Profile', icon: <PersonIcon />, path: '/mentor/profile' },
    // { text: 'Students', icon: <GroupIcon />, path: '/mentor/students' },
    { text: 'Attendance', icon: <EventNoteIcon />, path: '/mentor/attendance' },
    // { text: 'Assignments', icon: <AssignmentIcon />, path: '/mentor/assignments' },
    { text: 'Chat', icon: <ChatIcon />, path: '/mentor/chat' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <List
        sx={{
          flex: 1,
          px: isMobile ? 1 : 2,
          '& .MuiListItemButton-root': {
            borderRadius: 1,
            mb: 0.5,
            minHeight: 48,
            px: 2.5,
            justifyContent: isExpanded ? 'initial' : 'center',
          },
          '& .MuiListItemIcon-root': {
            minWidth: 0,
            mr: isExpanded ? 3 : 0,
            justifyContent: 'center',
          },
          '& .MuiListItemText-root': {
            opacity: isExpanded ? 1 : 0,
            transition: theme.transitions.create('opacity', {
              duration: theme.transitions.duration.shortest,
            }),
          },
        }}
      >
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? theme.palette.text.primary : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ px: isMobile ? 1 : 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              minHeight: 48,
              px: 2.5,
              justifyContent: isExpanded ? 'initial' : 'center',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.main',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isExpanded ? 3 : 0,
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {isExpanded && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default MentorSidebar; 