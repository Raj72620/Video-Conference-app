// pages/home.jsx

import React, { useContext, useState, useEffect, useCallback } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  TextField,
  Typography,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Drawer,
  Chip,
  Card,
  Divider,
  Badge
} from '@mui/material';
import {
  Videocam as MeetingIcon,
  Keyboard as KeyboardIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  Help as HelpIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Notifications as NotificationsIcon,
  Timer
} from '@mui/icons-material';

import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/home.module.css';
import server from '../environment';
import { CalendarWidget, FullYearCalendar } from '../components/Calendar/Calendar';
import { CalendarMonth as CalendarMonthIcon } from '@mui/icons-material';

function HomeComponent() {
  const navigate = useNavigate();
  const { userData, logout, addToUserHistory, getHistoryOfUser, deleteMeeting } = useContext(AuthContext);

  // States
  const [joinCode, setJoinCode] = useState("");
  const [newMeetingCode, setNewMeetingCode] = useState("");
  const [newMeetingPassword, setNewMeetingPassword] = useState("");

  // Dialogs
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingMeetingCode, setPendingMeetingCode] = useState(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // User Menu
  const [anchorEl, setAnchorEl] = useState(null);

  // Feedback
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [startingSoonMeeting, setStartingSoonMeeting] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const addNotification = useCallback((msg, meeting) => {
    const newNote = { id: Date.now(), msg, meeting, time: new Date() };
    setNotifications(prev => [newNote, ...prev].slice(0, 10));
    setSuccessMsg(msg);
  }, []);

  const checkMeetingLifecycle = useCallback((now) => {
    const notifiedKeys = JSON.parse(localStorage.getItem('notifiedMeetings') || '{}');
    let startingSoon = null;

    scheduledMeetings.forEach(m => {
      if (m.status !== 'Scheduled') return;

      const meetingTime = new Date(`${m.date.split('T')[0]}T${m.startTime}`);
      const diffSeconds = (meetingTime - now) / 1000;

      // 10 minutes reminder
      if (diffSeconds <= 600 && diffSeconds > 590 && !notifiedKeys[`${m._id}_10`]) {
        addNotification(`Meeting "${m.meetingCode}" starts in 10 minutes!`, m);
        notifiedKeys[`${m._id}_10`] = true;
      }

      // 2 minutes reminder & Starting Soon section
      if (diffSeconds <= 120 && diffSeconds > 0) {
        startingSoon = m;
        if (diffSeconds > 110 && !notifiedKeys[`${m._id}_2`]) {
          addNotification(`Meeting "${m.meetingCode}" is starting soon!`, m);
          notifiedKeys[`${m._id}_2`] = true;
        }
      }
    });

    setStartingSoonMeeting(startingSoon);
    localStorage.setItem('notifiedMeetings', JSON.stringify(notifiedKeys));
  }, [scheduledMeetings, addNotification]);

  const fetchScheduledMeetings = useCallback(async () => {
    if (!userData?.id) return;
    try {
      const res = await axios.get(`${server}/api/v1/scheduled/user`, {
        params: { userId: userData.id }
      });
      setScheduledMeetings(res.data);
    } catch (e) {
      console.error("Error fetching scheduled", e);
    }
  }, [userData?.id]);

  // 1. Generate random code once on mount
  useEffect(() => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewMeetingCode(randomCode);
  }, []);

  // 2. Fetch scheduled meetings once or when user changes
  useEffect(() => {
    fetchScheduledMeetings();
  }, [fetchScheduledMeetings]);

  // 3. Keep clock updated and check meeting lifecycle
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkMeetingLifecycle(now);
    }, 1000);

    return () => clearInterval(timer);
  }, [checkMeetingLifecycle]);

  const handleCreateMeeting = async () => {
    if (!newMeetingCode.trim()) {
      setError("Meeting code is required");
      return;
    }
    if (!newMeetingPassword.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Using Server URL:", server);
      await axios.post(`${server}/api/v1/meetings/start`, {
        meetingCode: newMeetingCode,
        password: newMeetingPassword,
        token: token
      });

      // Meeting is automatically added to history by the backend
      navigate(`/${newMeetingCode}`);
    } catch (err) {
      console.error("Create meeting error:", err);
      if (err.response?.status === 401) {
        logout();
        return;
      }
      setError(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = async () => {
    // Clean code (remove URL part if pasted)
    const cleanCode = joinCode.split('/').pop().toUpperCase();

    if (!cleanCode.trim()) {
      setError("Please enter a meeting code");
      return;
    }

    setLoading(true);
    try {
      // Validate Meeting
      await axios.post(`${server}/api/v1/meetings/validate`, {
        meetingCode: cleanCode
      });

      // If successful (no password or handled), join
      await addToUserHistory(cleanCode);
      navigate(`/${cleanCode}`);

    } catch (err) {
      if (err.response?.status === 401) {
        // Password required
        setPendingMeetingCode(cleanCode);
        setPasswordDialogOpen(true);
      } else {
        setError(err.response?.data?.message || "Failed to join meeting");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordJoin = async () => {
    setLoading(true);
    try {
      await axios.post(`${server}/api/v1/meetings/validate`, {
        meetingCode: pendingMeetingCode,
        password: joinPassword
      });

      await addToUserHistory(pendingMeetingCode);
      setPasswordDialogOpen(false);
      navigate(`/${pendingMeetingCode}`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = useCallback(async () => {
    try {
      if (!userData?.username) return;
      const response = await axios.get(`${server}/api/v1/recordings/user`, {
        params: { username: userData.username }
      });
      setRecordings(response.data);
    } catch (err) {
      console.error("Failed to fetch recordings", err);
    }
  }, [userData?.username]);

  const handleDeleteRecording = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) return;
    try {
      await axios.delete(`${server}/api/v1/recordings/delete/${id}`);
      fetchRecordings(); // Refresh list
    } catch (err) {
      console.error("Failed to delete recording", err);
      alert("Failed to delete recording");
    }
  };

  useEffect(() => {
    if (profileOpen) {
      fetchRecordings();
    }
  }, [profileOpen, fetchRecordings]);

  const handleHistoryOpen = async () => {
    setHistoryOpen(true);
    try {
      const data = await getHistoryOfUser();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const displayUser = userData || { name: "Guest", email: "guest@example.com" };

  return (
    <div className={styles.homeContainer}>
      {/* 1. Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <MeetingIcon sx={{ color: '#fff', fontSize: 28 }} />
          <span>VidTalk</span>
        </div>

        <div className={styles.navLinks}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <HomeIcon fontSize="small" /> <span>Home</span>
          </div>
          <div className={styles.navItem} onClick={handleHistoryOpen}>
            <HistoryIcon fontSize="small" /> <span>History</span>
          </div>
          <div className={styles.navItem} onClick={() => setCalendarOpen(true)}>
            <CalendarMonthIcon fontSize="small" /> <span>Calendar</span>
          </div>
          <div className={styles.navItem} onClick={() => alert("Help Center coming soon")}>
            <HelpIcon fontSize="small" /> <span>Help</span>
          </div>
        </div>

        <div className={styles.authSection}>
          <IconButton sx={{ color: '#fff', mr: 1 }} onClick={(e) => setNotificationAnchor(e.currentTarget)}>
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <div className={styles.profile} onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b00', fontSize: 14 }}>
              {displayUser.name?.charAt(0).toUpperCase()}
            </Avatar>
            <span className={styles.profileName}>{displayUser.name?.split(" ")[0]}</span>
          </div>
        </div>
      </nav>

      {/* 2. Main Dashboard Content */}
      <div className={styles.mainContent}>

        {/* Calendar Widget (Top Left) */}
        <div className={styles.calendarPositioner}>
          <CalendarWidget
            onClick={() => setCalendarOpen(true)}
            scheduledMeetings={scheduledMeetings}
          />
        </div>

        {/* Clock Section (Top Center) */}
        <div className={styles.clockSection}>
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)}
          </div>
          <div className={styles.dateDisplay}>
            {formatFullDate(currentTime)}
          </div>

          {/* New Starting Soon Section */}
          {startingSoonMeeting && (
            <div className={styles.startingSoonContainer}>
              <div className={styles.startingHeading}>
                <Timer sx={{ fontSize: 18, mr: 1 }} /> STARTING SOON
              </div>
              <div className={styles.startingDetails}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{startingSoonMeeting.meetingCode}</Typography>
                <div className={styles.countdown}>
                  Starts in: {(() => {
                    const meetingTime = new Date(`${startingSoonMeeting.date.split('T')[0]}T${startingSoonMeeting.startTime}`);
                    const diff = Math.max(0, Math.floor((meetingTime - currentTime) / 1000));
                    const m = Math.floor(diff / 60);
                    const s = diff % 60;
                    return `${m}:${s.toString().padStart(2, '0')}`;
                  })()}
                </div>
              </div>
              <Button
                variant="contained"
                fullWidth
                disabled={(() => {
                  const meetingTime = new Date(`${startingSoonMeeting.date.split('T')[0]}T${startingSoonMeeting.startTime}`);
                  return currentTime < meetingTime;
                })()}
                onClick={async () => {
                  try {
                    await axios.patch(`${server}/api/v1/scheduled/start/${startingSoonMeeting._id}`);
                    navigate(`/${startingSoonMeeting.meetingCode}`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                sx={{ mt: 2, borderRadius: '12px', bgcolor: '#8b5cf6' }}
              >
                Start Meeting
              </Button>
            </div>
          )}
        </div>

        {/* Action Cards (Below Clock) */}
        <div className={styles.actionCards}>

          {/* Join Meeting Card */}
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.joinIcon}`}>
              <KeyboardIcon />
            </div>
            <h3 className={styles.cardTitle}>Join Meeting</h3>
            <p className={styles.cardDesc}>
              Enter a code or link to connect with your team instantly.
            </p>

            <div className={styles.inputWrapper}>
              <input
                className={styles.input}
                placeholder="Meeting code or link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinClick()}
              />
            </div>

            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleJoinClick}
              disabled={loading || !joinCode}
            >
              {loading ? 'Joining...' : 'Join Now'}
            </button>
          </div>

          {/* New Meeting Card */}
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.newIcon}`}>
              <VideoCallIcon />
            </div>
            <h3 className={styles.cardTitle}>New Meeting</h3>
            <p className={styles.cardDesc}>
              Create a secure room with password protection for your team.
            </p>

            <div className={styles.inputWrapper}>
              <label className={styles.label}>Meeting Code</label>
              <input
                className={styles.input}
                value={newMeetingCode}
                onChange={(e) => setNewMeetingCode(e.target.value)}
                placeholder="e.g. daily-standup"
              />
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                value={newMeetingPassword}
                onChange={(e) => setNewMeetingPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>

            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleCreateMeeting}
              disabled={loading}
            >
              <VideoCallIcon />
              {loading ? 'Creating...' : 'Start Meeting'}
            </button>
          </div>

        </div>
      </div>

      {/* Dialogs & Menus (Unchanged logic, just ensure they are rendered) */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        PaperProps={{ style: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: '16px', border: '1px solid #333' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>Enter Meeting Password</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, minWidth: '300px' }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              type="password"
              label="Password"
              variant="outlined"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              sx={{
                input: { color: 'white' },
                label: { color: '#888' },
                '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#444' }, '&:hover fieldset': { borderColor: '#666' } }
              }}
            />
          </Box>
          <Button variant="contained" fullWidth sx={{ mt: 3, bgcolor: '#0e71eb' }} onClick={handlePasswordJoin}>
            Verify & Join
          </Button>
        </DialogContent>
      </Dialog>

      {/* History Drawer */}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '450px' },
            backgroundColor: '#0f1419', // Dark background matching modern dark mode
            color: '#fff',
            borderLeft: '1px solid #333'
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h5" fontWeight="bold">History</Typography>
            </Box>
            <IconButton onClick={() => setHistoryOpen(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {history.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <HistoryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
              <Typography>No meeting history found</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', pr: 1 }}>
              {history.slice().reverse().map((meeting, index) => {
                const isActive = !meeting.isEnded;
                return (
                  <Card
                    key={meeting._id || index}
                    sx={{
                      backgroundColor: '#1e1e1e',
                      color: '#fff',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(76, 175, 80, 0.3)' : '#333',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)', borderColor: isActive ? '#4caf50' : '#555' }
                    }}
                  >
                    {/* Active Indicator Strip */}
                    <Box sx={{
                      position: 'absolute',
                      top: 15,
                      right: 15,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#4caf50' : '#ef4444',
                      boxShadow: isActive ? '0 0 10px #4caf50' : 'none'
                    }} />

                    <Box sx={{ p: 2 }}>
                      {/* Host Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: isActive ? '#2e7d32' : '#424242', fontSize: 14, mr: 1.5 }}>
                          {meeting.hostName ? meeting.hostName.charAt(0).toUpperCase() : <PersonIcon fontSize="small" />}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#888', display: 'block', lineHeight: 1 }}>HOST</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{meeting.hostName || "Unknown"}</Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                      {/* Code & Time */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="caption" color="#888">CODE</Typography>
                          <Typography variant="body1" fontFamily="monospace" sx={{ letterSpacing: 1 }}>{meeting.meetingCode}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="#888">DATE</Typography>
                          <Typography variant="body2">{formatDate(meeting.date)}</Typography>
                        </Box>
                      </Box>

                      {/* Status & Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Chip
                          label={isActive ? "Active Now" : "Ended"}
                          size="small"
                          sx={{
                            backgroundColor: isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isActive ? '#4caf50' : '#ef4444',
                            fontWeight: 'bold',
                            border: '1px solid',
                            borderColor: isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                          }}
                        />

                        <Box>
                          <IconButton
                            size="small"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Delete from history?")) {
                                try {
                                  await deleteMeeting(meeting._id);
                                  await handleHistoryOpen(); // Refresh list
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            sx={{ color: '#666', mr: 1, '&:hover': { color: '#ef4444' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>

                          <Button
                            variant={isActive ? "contained" : "outlined"}
                            size="small"
                            onClick={() => {
                              if (isActive) navigate(`/${meeting.meetingCode}`);
                            }}
                            disabled={!isActive}
                            sx={{
                              borderRadius: 20,
                              textTransform: 'none',
                              borderColor: '#444',
                              backgroundColor: isActive ? '#2563eb' : 'transparent',
                              color: isActive ? '#fff' : '#666',
                              '&:hover': {
                                backgroundColor: isActive ? '#1d4ed8' : 'rgba(255,255,255,0.05)'
                              }
                            }}
                          >
                            {isActive ? "Join" : "Closed"}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: '16px', border: '1px solid #333' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
          Your Profile & Recordings
          <IconButton onClick={() => setProfileOpen(false)} sx={{ color: '#888' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            {/* Left Column: User Info */}
            <Box sx={{ flex: 1, textAlign: 'center', borderRight: { md: '1px solid #333' }, pr: { md: 4 } }}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', bgcolor: '#ff6b00', margin: '0 auto 16px' }}>{displayUser.name?.charAt(0).toUpperCase()}</Avatar>
              <Typography variant="h5" fontWeight="bold">{displayUser.name}</Typography>
              <Typography variant="body1" color="#888" sx={{ mb: 3 }}>{displayUser.email}</Typography>
              <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => { setProfileOpen(false); handleHistoryOpen(); }} fullWidth sx={{ borderRadius: 2, mb: 2, borderColor: '#8b5cf6', color: '#8b5cf6' }}>View Meeting History</Button>
              <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout} fullWidth sx={{ borderRadius: 2 }}>Sign Out</Button>
            </Box>

            {/* Right Column: Recordings */}
            <Box sx={{ flex: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <VideoCallIcon sx={{ mr: 1, color: '#8b5cf6' }} /> My Recordings
              </Typography>

              {recordings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                  <Typography color="#666">No recordings found.</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                  {recordings.map((rec) => (
                    <Box key={rec._id} sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, mb: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">Meeting: {rec.meetingCode}</Typography>
                        <Typography variant="caption" color="#888">{formatDate(rec.date)}</Typography>
                      </Box>

                      {/* Video Player Preview */}
                      <Box sx={{ bgcolor: '#000', borderRadius: 1, overflow: 'hidden', mb: 1, position: 'relative' }}>
                        <video
                          src={`${server}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '').startsWith('/') ? '' : '/'}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '')}`}
                          controls
                          style={{ width: '100%', maxHeight: '150px' }}
                          onError={(e) => console.error("Video playback error", e)}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          href={`${server}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '').startsWith('/') ? '' : '/'}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '')}`}
                          download
                          target="_blank"
                          sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          variant="outlined"
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => {
                            const url = `${server}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '').startsWith('/') ? '' : '/'}${rec.videoUrl.replace(/^(backend\/public\/|public\/)/, '')}`;
                            navigator.clipboard.writeText(url);
                            alert("Link copied to clipboard!");
                          }}
                          sx={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                          variant="outlined"
                        >
                          Share
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteRecording(rec._id)}
                          color="error"
                          variant="outlined"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ style: { backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #333' } }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); setProfileOpen(true); }}><PersonIcon fontSize="small" sx={{ mr: 1 }} /> Profile</MenuItem>

        <MenuItem onClick={() => { setAnchorEl(null); alert("Settings coming soon!"); }}><SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Settings</MenuItem>
        <MenuItem onClick={logout} sx={{ color: '#ff4444' }}><LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout</MenuItem>
      </Menu>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError("")} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>

      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg("")} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setSuccessMsg("")} sx={{ width: '100%', bgcolor: '#8b5cf6' }}>{successMsg}</Alert>
      </Snackbar>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', border: '1px solid #333', width: 300 } }}
      >
        <Typography variant="subtitle2" sx={{ p: 2, borderBottom: '1px solid #333' }}>Notifications</Typography>
        {notifications.length === 0 ? (
          <MenuItem sx={{ p: 2, color: '#666' }}>No new notifications</MenuItem>
        ) : (
          notifications.map(n => (
            <MenuItem key={n.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #222', p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '500' }}>{n.msg}</Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>{n.time.toLocaleTimeString()}</Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      <FullYearCalendar open={calendarOpen} onClose={() => { setCalendarOpen(false); fetchScheduledMeetings(); }} />
    </div>
  );
}

export default withAuth(HomeComponent);