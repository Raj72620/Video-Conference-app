import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Card,
    Chip,
    Button,
    Stack,
    Divider
} from '@mui/material';
import {
    Close as CloseIcon,
    PlayArrow,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import server from '../../environment';
import styles from './ScheduleMeeting.module.css';

const MeetingManager = ({ open, onClose, userData }) => {
    const [meetings, setMeetings] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const fetchMeetings = useCallback(async () => {
        try {
            const res = await axios.get(`${server}/api/v1/scheduled/user`, {
                params: { userId: userData.id }
            });
            setMeetings(res.data);
        } catch (e) {
            console.error(e);
        }
    }, [userData.id]);

    useEffect(() => {
        if (open) fetchMeetings();
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [open, fetchMeetings]);

    const getStatus = (meeting) => {
        const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.startTime}`);
        const diff = (meetingDateTime - currentTime) / 1000; // in seconds

        if (meeting.status === 'Ended' || meeting.status === 'Cancelled') return meeting.status;
        if (meeting.status === 'Live') return 'Live';

        if (diff <= 0) return 'Ready';
        if (diff <= 120) return 'Starting Soon';
        return 'Scheduled';
    };

    const formatCountdown = (meeting) => {
        const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.startTime}`);
        const diff = Math.floor((meetingDateTime - currentTime) / 1000);
        if (diff <= 0) return "00:00";
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this meeting?")) return;
        try {
            await axios.delete(`${server}/api/v1/scheduled/delete/${id}`);
            fetchMeetings();
        } catch (e) { console.error(e); }
    };

    const handleStart = async (meeting) => {
        try {
            await axios.patch(`${server}/api/v1/scheduled/start/${meeting._id}`);
            navigate(`/${meeting.meetingCode}`);
        } catch (e) { console.error(e); }
    };

    const upcomingMeetings = meetings.filter(m => ['Scheduled', 'Live'].includes(m.status));
    const pastMeetings = meetings.filter(m => ['Ended', 'Cancelled'].includes(m.status));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { bgcolor: '#0f1419', color: '#fff', borderRadius: '24px', border: '1px solid #333' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Typography variant="h5" fontWeight="800">MEETING MANAGER</Typography>
                <IconButton onClick={onClose} sx={{ color: '#aaa' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={4}>
                    {/* Active/Scheduled Section */}
                    <Box>
                        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, letterSpacing: 1 }}>UPCOMING MEETINGS</Typography>
                        {upcomingMeetings.length === 0 ? (
                            <Typography color="#666">No upcoming meetings scheduled.</Typography>
                        ) : (
                            <Stack spacing={2}>
                                {upcomingMeetings.map(meeting => {
                                    const status = getStatus(meeting);
                                    const isStartingSoon = status === 'Starting Soon';
                                    const isReady = status === 'Ready' || status === 'Live';

                                    return (
                                        <Card key={meeting._id} className={isStartingSoon ? styles.startingSoonCard : styles.meetingCard}>
                                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Typography variant="h6" fontWeight="bold">{meeting.meetingCode}</Typography>
                                                        <Chip
                                                            label={status}
                                                            size="small"
                                                            color={isReady ? "success" : isStartingSoon ? "warning" : "primary"}
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="#aaa">
                                                        {new Date(meeting.date).toDateString()} at {meeting.startTime} ({meeting.duration} min)
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {isStartingSoon && (
                                                        <Box sx={{ textAlign: 'center', border: '1px solid #ed6c02', borderRadius: '8px', p: 1 }}>
                                                            <Typography variant="caption" color="warning.main">STARTS IN</Typography>
                                                            <Typography variant="h6" color="warning.main" sx={{ fontFamily: 'monospace' }}>
                                                                {formatCountdown(meeting)}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    <Stack direction="row" spacing={1}>
                                                        <IconButton size="small" sx={{ color: '#888' }}><EditIcon /></IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(meeting._id)}><DeleteIcon /></IconButton>
                                                        <Button
                                                            variant="contained"
                                                            disabled={!isReady}
                                                            startIcon={<PlayArrow />}
                                                            onClick={() => handleStart(meeting)}
                                                            sx={{ borderRadius: '8px' }}
                                                        >
                                                            Start
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>

                    <Divider sx={{ borderColor: '#222' }} />

                    {/* History Section */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <HistoryIcon sx={{ color: '#888' }} />
                            <Typography variant="subtitle2" color="#888" sx={{ letterSpacing: 1 }}>MEETING HISTORY</Typography>
                        </Box>
                        <Stack spacing={1}>
                            {pastMeetings.map(meeting => (
                                <Box key={meeting._id} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">{meeting.meetingCode}</Typography>
                                        <Typography variant="caption" color="#666">
                                            {new Date(meeting.date).toLocaleDateString()} | {meeting.startTime}
                                        </Typography>
                                    </Box>
                                    <Chip label={meeting.status} size="small" variant="outlined" sx={{ color: '#666', borderColor: '#444' }} />
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default MeetingManager;
