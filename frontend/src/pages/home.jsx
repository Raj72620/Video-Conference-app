// pages/home.jsx

import React, { useContext, useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import {
  Videocam as MeetingIcon,
  Keyboard as KeyboardIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Help as HelpIcon,
  PlayArrow as PlayArrowIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/home.module.css';
import server from '../environment';

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

  // User Menu
  const [anchorEl, setAnchorEl] = useState(null);

  // Feedback
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize random code for new meeting
  useEffect(() => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewMeetingCode(randomCode);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCreateMeeting = async () => {
    if (!newMeetingCode.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Using Server URL:", server);
      await axios.post(`${server}/api/v1/meetings/start`, {
        meetingCode: newMeetingCode,
        password: newMeetingPassword,
        token: token
      });

      await addToUserHistory(newMeetingCode);
      navigate(`/${newMeetingCode}`);
    } catch (err) {
      console.error("Create meeting error:", err);
      setError(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = async () => {
    // Clean code (remove URL part if pasted)
    const cleanCode = joinCode.split('/').pop();

    if (!cleanCode.trim()) {
      setError("Please enter a meeting code");
      return;
    }

    setLoading(true);
    try {
      // Validate Meeting
      const response = await axios.post(`${server}/api/v1/meetings/validate`, {
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

  const fetchRecordings = async () => {
    try {
      if (!userData?.username) return;
      const response = await axios.get(`${server}/api/v1/recordings/user`, {
        params: { username: userData.username }
      });
      setRecordings(response.data);
    } catch (err) {
      console.error("Failed to fetch recordings", err);
    }
  };

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
  }, [profileOpen]);

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
          <span>Workplace</span>
        </div>

        <div className={styles.navLinks}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <HomeIcon fontSize="small" /> Home
          </div>
          <div className={styles.navItem} onClick={handleHistoryOpen}>
            <HistoryIcon fontSize="small" /> History
          </div>
          <div className={styles.navItem} onClick={() => alert("Help Center coming soon")}>
            <HelpIcon fontSize="small" /> Help
          </div>
        </div>

        <div className={styles.authSection}>
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

        {/* Clock Section (Top Center) */}
        <div className={styles.clockSection}>
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)}
          </div>
          <div className={styles.dateDisplay}>
            {formatFullDate(currentTime)}
          </div>
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
              <label className={styles.label}>Custom Code (Optional)</label>
              <input
                className={styles.input}
                value={newMeetingCode}
                onChange={(e) => setNewMeetingCode(e.target.value)}
                placeholder="e.g. daily-standup"
              />
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.label}>Password (Optional)</label>
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

      {/* Reuse History & Profile Dialogs + Menu from previous state */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{ style: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: '16px', border: '1px solid #333', minWidth: '400px', maxHeight: '600px' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Meeting History
          <IconButton onClick={() => setHistoryOpen(false)} sx={{ color: '#888' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: '#888' }}><HistoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} /><Typography>No meeting history found</Typography></Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {history.slice().reverse().map((meeting) => (
                <Box key={meeting._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">{meeting.meetingCode}</Typography>
                    <Typography variant="caption" color="#888">{formatDate(meeting.date)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="outlined" size="small" onClick={() => { setHistoryOpen(false); navigate(`/${meeting.meetingCode}`); }} sx={{ borderRadius: 20, borderColor: '#444', color: '#fff' }}>Rejoin</Button>
                    <IconButton size="small" onClick={async () => { try { await deleteMeeting(meeting._id); await handleHistoryOpen(); } catch (e) { console.log(e); } }} sx={{ ml: 1, color: '#e41e3f' }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

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
                          src={`${server}/${rec.videoUrl.replace('backend/public/', '')}`}
                          controls
                          style={{ width: '100%', maxHeight: '150px' }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => {
                            navigator.clipboard.writeText(`${server}/${rec.videoUrl.replace('backend/public/', '')}`);
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
    </div>
  );
}

export default withAuth(HomeComponent);