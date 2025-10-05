import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const Footer: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{
      width: '100%',
      bgcolor: 'primary.main',
      color: 'white',
      p: 2,
      textAlign: 'center',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: theme.zIndex.drawer + 1,
    }}>
      <Typography variant="body2">
        © {new Date().getFullYear()} MERN Firebase App. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;