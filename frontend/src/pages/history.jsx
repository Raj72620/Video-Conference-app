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
  Chip
} from '@mui/material';
import {
  Home as HomeIcon,
  CalendarToday as DateIcon,
  Code as CodeIcon,
  Videocam as MeetingIcon
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
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  }, [getHistoryOfUser]);

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

  const handleCardClick = (meetingCode) => {
    navigate(`/${meetingCode}`);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Meeting History
          </Typography>
          <IconButton 
            onClick={() => navigate("/home")}
            sx={{ 
              backgroundColor: 'primary.main', 
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <HomeIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Box sx={{ 
            backgroundColor: 'error.light', 
            p: 3, 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              color="error" 
              sx={{ mt: 2 }}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        ) : meetings.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: 6, 
            backgroundColor: 'background.paper',
            borderRadius: 3,
            boxShadow: 1
          }}>
            <MeetingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Meeting History Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your attended meetings will appear here
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/home')}
            >
              Start a New Meeting
            </Button>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3 
          }}>
            {meetings.map((meeting, index) => (
              <Card 
                key={index} 
                sx={{ 
                  p: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => handleCardClick(meeting.meetingCode)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    mr: 2,
                    width: 40,
                    height: 40
                  }}>
                    <MeetingIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" component="h2">
                    Meeting #{index + 1}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                  <CodeIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Code:</strong> {meeting.meetingCode}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                  <DateIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    <strong>Date:</strong> {formatDate(meeting.date)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Chip 
                    label="View Meeting" 
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      alignSelf: 'flex-end',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}