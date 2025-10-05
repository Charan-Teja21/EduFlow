import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Stack,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-toastify';

interface UserData {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName?: string;
  address?: string;
  phoneNumber?: string;
  mentorId?: string | null;
}

interface MentorData {
  id: string;
  displayName: string;
  email: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editMentorId, setEditMentorId] = useState<string | '' | null>(null);
  const theme = useTheme();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList: UserData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          role: data.role,
          status: data.status,
          displayName: data.displayName || undefined,
          address: data.address || undefined,
          phoneNumber: data.phoneNumber || undefined,
          mentorId: data.mentorId || undefined,
        } as UserData;
      });
      setUsers(usersList.filter(user => user.role !== 'admin'));

      const mentorsList: MentorData[] = usersList
        .filter(user => user.role === 'mentor' && user.status === 'approved')
        .map(mentor => ({
          id: mentor.id,
          displayName: mentor.displayName || mentor.email,
          email: mentor.email,
        }));
      setMentors(mentorsList);

    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewDetails = (user: UserData) => {
    setSelectedUser(user);
    setEditDisplayName(user.displayName || '');
    setEditAddress(user.address || '');
    setEditPhoneNumber(user.phoneNumber || '');
    setEditMentorId(user.mentorId || '');
    setOpenDialog(true);
    setIsEditing(false); // Start in view mode
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setIsEditing(false); // Reset edit mode on close
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setLoading(true); // Set overall loading for the save operation
    try {
      const updatedData: Partial<UserData> = {
        displayName: editDisplayName,
        address: editAddress,
        phoneNumber: editPhoneNumber,
      };

      if (selectedUser.role === 'student') {
        updatedData.mentorId = editMentorId === '' ? undefined : editMentorId; // Changed null to undefined
      }

      await updateDoc(doc(db, "users", selectedUser.id), updatedData);
      toast.success("User updated successfully!");
      handleCloseDialog();
      fetchUsers(); // Re-fetch users to update the table
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: 'approved'
      });
      toast.success("User approved successfully!");
      fetchUsers();
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        toast.success("User deleted successfully!");
        fetchUsers();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user: " + error.message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending_approval':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <SchoolIcon />;
      case 'mentor':
        return <GroupIcon />;
      default:
        return <PersonIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        User Management
      </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and monitor all users in the system
        </Typography>
      </Box>

      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        sx={{ mb: 4 }}
        divider={<Box sx={{ width: '1px', bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />}
      >
        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <GroupIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Total Users</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{users.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircleIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Approved Users</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {users.filter(user => user.status === 'approved').length}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>Pending Approval</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {users.filter(user => user.status === 'pending_approval').length}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          overflow: 'hidden', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="user management table">
          <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mentor</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                  }}
              >
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {getRoleIcon(user.role)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body1" noWrap>
                          {user.displayName || user.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      size="small"
                      sx={{ 
                        bgcolor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status.replace('_', ' ')}
                      color={getStatusColor(user.status) as any}
                      size="small"
                    />
                </TableCell>
                <TableCell>
                  {user.role === 'student' && user.mentorId
                    ? mentors.find(m => m.id === user.mentorId)?.displayName || user.mentorId
                    : 'N/A'}
                </TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(user)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                  {user.status === 'pending_approval' && (
                        <Tooltip title="Approve User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleApproveUser(user.id)}
                            color="success"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                  )}
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          {isEditing ? 'Edit User Details' : 'User Details'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedUser && (
            <Box component="form" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main }}>
                    {getRoleIcon(selectedUser.role)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                      {selectedUser.displayName || selectedUser.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {selectedUser.email}
                    </Typography>
                  </Box>
                </Box>

              <TextField
                label="Display Name"
                fullWidth
                value={isEditing ? editDisplayName : selectedUser.displayName || ''}
                onChange={(e) => setEditDisplayName(e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
              <TextField
                label="Address"
                fullWidth
                value={isEditing ? editAddress : selectedUser.address || ''}
                onChange={(e) => setEditAddress(e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
              <TextField
                label="Phone Number"
                fullWidth
                value={isEditing ? editPhoneNumber : selectedUser.phoneNumber || ''}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />

              {selectedUser.role === 'student' && isEditing && ( 
                  <FormControl fullWidth>
                  <InputLabel id="mentor-select-label">Assign Mentor</InputLabel>
                  <Select
                    labelId="mentor-select-label"
                    id="mentor-select"
                    value={editMentorId || ''}
                    label="Assign Mentor"
                    onChange={(e) => setEditMentorId(e.target.value as string)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {mentors.map((mentor) => (
                      <MenuItem key={mentor.id} value={mentor.id}>
                        {mentor.displayName} ({mentor.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
               {selectedUser.role === 'student' && !isEditing && selectedUser.mentorId && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Assigned Mentor</Typography>
                    <Typography variant="body1" noWrap>
                      {mentors.find(m => m.id === selectedUser.mentorId)?.displayName || selectedUser.mentorId}
                    </Typography>
                  </Box>
              )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          {isEditing ? (
            <>
              <Button onClick={handleCloseDialog} variant="outlined">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveUser} 
                variant="contained" 
                color="primary"
                startIcon={<EditIcon />}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseDialog} variant="outlined">
                Close
              </Button>
              <Button 
                onClick={handleEditClick} 
                variant="contained" 
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 