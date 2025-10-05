import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify'; // Removing ToastContainer import
import 'react-toastify/dist/ReactToastify.css';
// import './App.css'; // This will be removed or its content integrated into RootLayout.css or other component styles.
import RootLayout from './components/Layout/RootLayout/RootLayout';

// Page Imports
import HomePage from './pages/Home/HomePage';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';

// Dashboard Components - Renamed to Profile
import AdminProfile from './pages/Admin/AdminProfile';
import MentorProfile from './pages/Mentor/MentorProfile';

// Dashboard Layout and Sidebar Imports
import DashboardLayout from './components/DashboardLayout/DashboardLayout';
import StudentSidebar from './components/DashboardLayout/StudentSidebar';
import MentorSidebar from './components/DashboardLayout/MentorSidebar';
import AdminSidebar from './components/DashboardLayout/AdminSidebar';

// Role-specific Home Page Imports
import StudentHome from './pages/Student/StudentHome';
import StudentProfile from './pages/Student/StudentProfile';
import MentorHome from './pages/Mentor/MentorHome';
import AdminHome from './pages/Admin/AdminHome';
import Attendance from './pages/Mentor/Attendance';
import Chat from './pages/Mentor/Chat';
import StudentChat from './pages/Student/Chat';

// Admin specific imports
import UserManagement from './pages/Admin/UserManagement/UserManagement';

import useAuth from './hooks/useAuth';
import { CircularProgress, Box, Typography, CssBaseline } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading user data...</Typography>
      </Box>
    );
  }

  if (!user) {
    // User is not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role || '')) {
    // User is logged in but doesn't have the allowed role, redirect to a generic home or unauthorized page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Nested Routes for Admin Dashboard with Sidebar */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout sidebarComponent={AdminSidebar} dashboardTitle="Admin Dashboard" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} /> {/* Default admin route */}
            <Route path="home" element={<AdminHome />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="users" element={<UserManagement />} /> {/* New route for User Management */}
          </Route>

          {/* Nested Routes for Mentor Dashboard with Sidebar */}
          <Route path="/mentor" element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <DashboardLayout sidebarComponent={MentorSidebar} dashboardTitle="Mentor Dashboard" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} /> {/* Default mentor route */}
            <Route path="home" element={<MentorHome />} />
            <Route path="profile" element={<MentorProfile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="chat" element={<Chat />} />
          </Route>

          {/* Nested Routes for Student Dashboard with Sidebar */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout sidebarComponent={StudentSidebar} dashboardTitle="Student Dashboard" />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} /> {/* Default student route */}
            <Route path="home" element={<StudentHome />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="chat" element={<StudentChat />} />
          </Route>

          {/* Fallback route for unauthenticated or unauthorized users, or unknown paths */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
      {/* <ToastContainer /> */}
    </Router>
  );
}

export default App;