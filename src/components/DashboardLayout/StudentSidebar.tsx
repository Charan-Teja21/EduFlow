import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

interface StudentSidebarProps {
  isExpanded: boolean;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isExpanded }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student/home' },
    { text: 'Profile', icon: <PersonIcon />, path: '/student/profile' },
    { text: 'Chat', icon: <ChatIcon />, path: '/student/chat' },
  ];

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
    }}>
      <List sx={{ 
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
      }}>
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
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? theme.palette.text.primary : 'inherit',
              }}>
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
    </Box>
  );
};

export default StudentSidebar; 