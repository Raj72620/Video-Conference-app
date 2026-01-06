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
  Delete as DeleteIcon
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
  const { addToUserHistory, getHistoryOfUser, userData, deleteMeeting } = useContext(AuthContext);
  const [openProfile, setOpenProfile] = useState(false);
  const [history, setHistory] = useState([]);

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
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  const handleCreateNewMeeting = () => {
    const randomCode = Math.random().toString(36).substring(2, 8);
    navigate(`/${randomCode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteMeeting(meetingId);
      fetchHistory(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Professional App Bar */}
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
                    gap: 1,
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                  onClick={() => setOpenProfile(true)}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                    {userData?.name || "User"}
                  </Typography>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                </Box>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Profile Dialog */}
        <Dialog
          open={openProfile}
          onClose={() => setOpenProfile(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              {userData?.name ? userData.name.charAt(0).toUpperCase() : <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6">{userData?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userData?.username}
              </Typography>
            </Box>
            <Button
              startIcon={<LogoutIcon />}
              color="error"
              onClick={handleLogout}
              sx={{ ml: 'auto' }}
            >
              Logout
            </Button>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="action" /> Meeting History
            </Typography>

            {history.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No meeting history found.
              </Typography>
            ) : (
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {history.map((meeting) => (
                  <Paper key={meeting._id} elevation={1} sx={{ mb: 2, overflow: 'hidden' }}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Button
                            size="small"
                            onClick={() => {
                              setOpenProfile(false);
                              navigate(`/${meeting.meetingCode}`);
                            }}
                          >
                            Join
                          </Button>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteMeeting(meeting._id)}>
                            <DeleteIcon color="error" fontSize='small' />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CodeIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {meeting.meetingCode}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <DateIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(meeting.date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProfile(false)}>Close</Button>
          </DialogActions>
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