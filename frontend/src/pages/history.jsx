import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Box,
  Button,
  Typography,
  IconButton,
  Container,
  CircularProgress,
  Avatar,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Home as HomeIcon,
  CalendarToday as DateIcon,
  Code as CodeIcon,
  Videocam as MeetingIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#4361ee',
    },
    secondary: {
      main: '#3a0ca3',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  },
});

export default function History() {

  const { getHistoryOfUser, deleteMeeting } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (err) {
        setError('Failed to load meeting history. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser, refresh]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCardClick = (meetingCode) => {
    navigate(`/${meetingCode}`);
  };

  const handleDelete = async (meetingId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this from your history?")) {
      try {
        await deleteMeeting(meetingId);
        setRefresh(prev => !prev);
      } catch (err) {
        setError('Failed to delete meeting. Please try again.');
        console.error(err);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 6,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            p: 3,
            borderRadius: 4,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Meeting History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track and manage your past conference sessions
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => navigate("/home")}
              sx={{
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': { backgroundColor: '#f1f5f9', transform: 'scale(1.1)' },
                transition: 'all 0.2s'
              }}
            >
              <HomeIcon color="primary" />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          ) : meetings.length === 0 ? (
            <Box sx={{
              textAlign: 'center',
              p: 8,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 4,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <MeetingIcon sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#64748b' }}>
                No Meeting History Found
              </Typography>
              <Button variant="contained" sx={{ mt: 3, borderRadius: 2 }} onClick={() => navigate('/home')}>
                Start New Meeting
              </Button>
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
              gap: 4
            }}>
              {meetings.map((meeting, index) => {
                const isActive = !meeting.isEnded;
                return (
                  <Card
                    key={index}
                    sx={{
                      borderRadius: 4,
                      overflow: 'visible',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      },
                      position: 'relative',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)'
                    }}
                  >
                    {/* Active Status Indicator Strip */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: isActive ? 'linear-gradient(90deg, #4caf50, #8bc34a)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16
                    }} />

                    <Box sx={{ p: 3 }}>
                      {/* Host Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{
                          bgcolor: isActive ? 'success.light' : 'grey.300',
                          color: isActive ? 'success.dark' : 'grey.600',
                          width: 48,
                          height: 48,
                          mr: 2,
                          boxShadow: 2
                        }}>
                          {meeting.hostName ? meeting.hostName.charAt(0).toUpperCase() : <PersonIcon />}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            HOST
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {meeting.hostName || "Unknown Host"}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Meeting Details */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <CodeIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 20 }} />
                          <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.primary', bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
                            {meeting.meetingCode}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <DateIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(meeting.date)} • {formatTime(meeting.date)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Badge */}
                      <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 20,
                        backgroundColor: isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid',
                        borderColor: isActive ? 'success.main' : 'error.main',
                        mb: 3
                      }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: isActive ? 'success.main' : 'error.main',
                          mr: 1
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: isActive ? 'success.main' : 'error.main' }}>
                          {isActive ? 'Meeting is Active' : 'Meeting Ended'}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant={isActive ? "contained" : "outlined"}
                          color={isActive ? "primary" : "inherit"}
                          fullWidth
                          onClick={() => handleCardClick(meeting.meetingCode)}
                          disabled={!isActive}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: isActive ? 4 : 0
                          }}
                        >
                          {isActive ? 'Join Now' : 'Ended'}
                        </Button>
                        <IconButton
                          onClick={(e) => handleDelete(meeting._id, e)}
                          sx={{
                            color: 'text.secondary',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            '&:hover': { color: 'error.main', borderColor: 'error.main', bgcolor: 'error.lighter' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}