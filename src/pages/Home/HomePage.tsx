import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the MERN Firebase App!
        </Typography>
        <Typography variant="body1" align="center">
          This is a static home page. Please use the navigation bar to explore other sections.
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;