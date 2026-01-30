import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    Grid,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    CalendarToday,
    VpnKey,
    Code,
    Timer,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import server from '../../environment';

const ScheduleMeeting = ({ open, onClose, selectedDate, userData, onMeetingScheduled }) => {
    const [meetingData, setMeetingData] = useState({
        meetingCode: "", // Start empty or generated
        password: Math.random().toString(36).substring(2, 8),
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: "",
        duration: 30,
        description: ""
    });

    useEffect(() => {
        if (open && !meetingData.meetingCode) {
            setMeetingData(prev => ({
                ...prev,
                meetingCode: Math.random().toString(36).substring(2, 8).toUpperCase()
            }));
        }
    }, [open, meetingData.meetingCode]);

    useEffect(() => {
        if (selectedDate) {
            setMeetingData(prev => ({ ...prev, date: selectedDate.toISOString().split('T')[0] }));
        }
    }, [selectedDate]);

    const handleSchedule = async () => {
        if (!meetingData.meetingCode.trim()) {
            alert("Please provide a meeting code");
            return;
        }

        if (!meetingData.startTime) {
            alert("Please select a start time");
            return;
        }

        if (!userData || !userData.id) {
            alert("Session expired. Please login again.");
            return;
        }

        try {
            await axios.post(`${server}/api/v1/scheduled/schedule`, {
                ...meetingData,
                meetingCode: meetingData.meetingCode.trim().toUpperCase(),
                hostName: userData.name,
                userId: userData.id
            });
            onMeetingScheduled();
            onClose();
        } catch (e) {
            console.error("Scheduling error:", e.response?.data || e.message);
            const msg = e.response?.data?.message || "";
            if (msg.includes("duplicate key")) {
                alert("This meeting code is already taken. Please try another one.");
            } else {
                alert(`Failed to schedule meeting: ${msg || "Internal Server Error"}`);
            }
        }
    };

    const regenerateCode = () => {
        setMeetingData(prev => ({
            ...prev,
            meetingCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            password: Math.random().toString(36).substring(2, 8)
        }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#111',
                    color: '#fff',
                    borderRadius: '20px',
                    border: '1px solid #333'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ color: '#8b5cf6' }} />
                    <Typography variant="h6">Schedule New Meeting</Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#888' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Meeting Code"
                            fullWidth
                            value={meetingData.meetingCode}
                            onChange={(e) => setMeetingData({ ...meetingData, meetingCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. MY-MEETING-CODE"
                            InputProps={{ startAdornment: <Code sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                            sx={inputStyles}
                        />
                        <IconButton onClick={regenerateCode} sx={{ color: '#8b5cf6' }} title="Generate Random Code"><RefreshIcon /></IconButton>
                    </Box>

                    <TextField
                        label="Password"
                        fullWidth
                        value={meetingData.password}
                        onChange={(e) => setMeetingData({ ...meetingData, password: e.target.value })}
                        InputProps={{ startAdornment: <VpnKey sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                        sx={inputStyles}
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                type="date"
                                label="Date"
                                fullWidth
                                value={meetingData.date}
                                onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={inputStyles}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                type="time"
                                label="Start Time"
                                fullWidth
                                value={meetingData.startTime}
                                onChange={(e) => setMeetingData({ ...meetingData, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={inputStyles}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        type="number"
                        label="Duration (minutes)"
                        fullWidth
                        value={meetingData.duration}
                        onChange={(e) => setMeetingData({ ...meetingData, duration: e.target.value })}
                        InputProps={{ startAdornment: <Timer sx={{ mr: 1, color: '#8b5cf6' }} /> }}
                        sx={inputStyles}
                    />

                    <TextField
                        label="Description (Optional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={meetingData.description}
                        onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                        sx={inputStyles}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSchedule}
                        sx={{
                            bgcolor: '#8b5cf6',
                            py: 1.5,
                            borderRadius: '12px',
                            '&:hover': { bgcolor: '#7c3aed' }
                        }}
                    >
                        Schedule Meeting
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        '& fieldset': { borderColor: '#333' },
        '&:hover fieldset': { borderColor: '#444' },
        '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
    },
    '& .MuiInputLabel-root': { color: '#888' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' }
};

export default ScheduleMeeting;
