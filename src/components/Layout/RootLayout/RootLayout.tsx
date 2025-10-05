import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from '../Navbar';
import Footer from '../Footer';
import { Box, Container, Toolbar } from '@mui/material'; // Import Material-UI components and Toolbar for spacing
import { ToastContainer } from 'react-toastify';

function RootLayout() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Toolbar />
            <ToastContainer 
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                style={{ top: '90px' }}
            />
            <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Outlet />  
            </Container>
            <Footer />
        </Box>
    );
}
export default RootLayout; 