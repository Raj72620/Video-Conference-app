import React, { useContext, useState, useEffect } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  IconButton,
  TextField,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Stack,
  styled,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  Restore as HistoryIcon,
  ExitToApp as LogoutIcon,
  Videocam as MeetingIcon,
  Groups as JoinMeetingIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom styled components
const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #4361ee 30%, #3a0ca3 90%)',
  border: 0,
  borderRadius: 8,
  color: 'white',
  padding: '12px 24px',
  boxShadow: '0 3px 5px 2px rgba(74, 20, 140, .2)',
  '&:hover': {
    background: 'linear-gradient(45deg, #3a0ca3 30%, #4361ee 90%)',
  },
});

const AnimatedTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#4361ee',
      borderRadius: 8,
    },
    '&:hover fieldset': {
      borderColor: '#3a0ca3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3a0ca3',
      boxShadow: '0 0 0 2px rgba(58, 12, 163, 0.2)',
    },
  },
});

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4361ee',
    },
    secondary: {
      main: '#3a0ca3',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
  },
});

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory, getHistoryOfUser, userData, deleteMeeting, logout } = useContext(AuthContext);
  const [openProfile, setOpenProfile] = useState(false);
  const [history, setHistory] = useState([]);

  // Get user data from context or localStorage
  const displayUser = userData || (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : { name: "Guest", username: "No email provided" };
    } catch (e) {
      console.error("Error parsing stored user:", e);
      return { name: "Guest", username: "No email provided" };
    }
  })();

  useEffect(() => {
    if (openProfile) {
      fetchHistory();
    }
  }, [openProfile]);

  const fetchHistory = async () => {
    try {
      const data = await getHistoryOfUser();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      alert("Please enter a meeting code");
      return;
    }
    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (err) {
      console.error("Failed to join meeting", err);
      alert("Failed to join meeting. Please try again.");
    }
  };

  const handleCreateNewMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 8);
    navigate(`/${randomCode}`);
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteMeeting(meetingId);
      fetchHistory(); // Refresh list
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      alert("Failed to delete meeting. Please try again.");
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={0} sx={{
          backgroundColor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Container maxWidth="xl">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MeetingIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  VideoConnect
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    bgcolor: 'grey.100',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'grey.200' }
                  }}
                  onClick={() => setOpenProfile(true)}
                >
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    {displayUser.name ? displayUser.name.charAt(0).toUpperCase() : <PersonIcon fontSize='small' />}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                    {displayUser.name || "Guest"}
                  </Typography>
                </Box>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Improved Profile Dialog */}
        <Dialog
          open={openProfile}
          onClose={() => setOpenProfile(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, padding: 1 }
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" fontWeight="bold">User Profile</Typography>
            <IconButton onClick={() => setOpenProfile(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            {/* User Info Card */}
            <Paper elevation={0} sx={{
              p: 3,
              mb: 4,
              bgcolor: 'grey.50',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', bgcolor: 'primary.main' }}>
                {displayUser.name ? displayUser.name.charAt(0).toUpperCase() : <PersonIcon />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="700" color="text.primary">
                  {displayUser.name || "Guest User"}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {displayUser.username || displayUser.email || "No email provided"}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ borderRadius: 2 }}
                >
                  Log Out
                </Button>
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }}>
              <Chip label="Meeting History" />
            </Divider>

            {/* History List */}
            {history.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  No recent meetings found.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {history.slice().reverse().map((meeting) => (
                  <ListItem
                    key={meeting._id}
                    sx={{
                      mb: 2,
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 2,
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="600" color="primary">
                          {meeting.meetingCode}
                        </Typography>
                      }
                      secondary={formatDate(meeting.date)}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        onClick={() => {
                          setOpenProfile(false);
                          navigate(`/${meeting.meetingCode}`);
                        }}
                      >
                        Re-Join
                      </Button>
                      <IconButton size="small" color="error" onClick={() => handleDeleteMeeting(meeting._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 8
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 8,
            alignItems: 'center'
          }}>
            {/* Left Panel - Content */}
            <Box>
              <Typography variant="h3" component="h1" sx={{
                fontWeight: 700,
                mb: 3,
                lineHeight: 1.2
              }}>
                Premium Video Meetings Made Simple
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Connect with anyone, anywhere with crystal-clear video and audio quality.
              </Typography>

              {/* Join Meeting Section */}
              <Paper elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                mb: 4,
                border: '1px solid rgba(67, 97, 238, 0.2)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Join a Meeting
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <AnimatedTextField
                    fullWidth
                    label="Meeting Code"
                    variant="outlined"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinVideoCall();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'primary.main' }}>
                          <CodeIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                  <GradientButton
                    onClick={handleJoinVideoCall}
                    disabled={!meetingCode.trim()}
                    startIcon={<JoinMeetingIcon />}
                  >
                    Join
                  </GradientButton>
                </Stack>
              </Paper>

              {/* Create New Meeting */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Don't have a meeting?
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleCreateNewMeeting}
                  sx={{
                    borderRadius: 8,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    }
                  }}
                  startIcon={<MeetingIcon />}
                >
                  Create New Meeting
                </Button>
              </Box>
            </Box>

            {/* Right Panel - Illustration */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <img
                src="/ZoomImg3.jpg"
                alt="Video Meeting Illustration"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  height: 'auto',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(67, 97, 238, 0.2)',
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default withAuth(HomeComponent);