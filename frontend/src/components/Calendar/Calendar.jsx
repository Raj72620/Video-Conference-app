import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    startOfYear,
    endOfYear,
    eachMonthOfInterval
} from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    Typography,
    Badge,
    Button
} from '@mui/material';
import {
    Close as CloseIcon,
    CalendarMonth as CalendarIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import server from '../../environment';
import styles from './Calendar.module.css';
import ScheduleMeeting from './ScheduleMeeting';
import MeetingManager from './MeetingManager';

const CalendarWidget = ({ onClick, scheduledMeetings = [] }) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weeks = [];
    const daysToDisplay = calendarDays.slice(0, 35);
    for (let i = 0; i < daysToDisplay.length; i += 7) {
        weeks.push(daysToDisplay.slice(i, i + 7));
    }


    return (
        <div className={styles.calendarWidget} onClick={onClick}>
            <div className={styles.header}>
                <div className={styles.monthYear}>
                    {format(today, 'MMMM yyyy')}
                </div>
                <CalendarIcon sx={{ fontSize: 18, color: '#8b5cf6', opacity: 0.8 }} />
            </div>

            <div className={styles.dayLabelsRow}>
                {dayLabels.map((label, idx) => (
                    <div key={idx} className={styles.dayLabel}>{label[0]}</div>
                ))}
            </div>

            <div className={styles.weeksContainer}>
                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className={styles.weekRow}>
                        {week.map((day, i) => {
                            const meetingCount = scheduledMeetings.filter(m => isSameDay(new Date(m.date), day)).length;
                            return (
                                <div
                                    key={i}
                                    className={`${styles.dayCell} ${!isSameMonth(day, monthStart) ? styles.otherMonth : ''
                                        } ${isSameDay(day, today) ? styles.currentDay : ''}`}
                                >
                                    {meetingCount > 0 ? (
                                        <Badge variant="dot" color="primary" sx={{
                                            '& .MuiBadge-badge': { backgroundColor: isSameDay(day, today) ? '#fff' : '#8b5cf6' }
                                        }}>
                                            {format(day, 'd')}
                                        </Badge>
                                    ) : (
                                        format(day, 'd')
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MonthView = ({ monthDate, today, scheduledMeetings, onDayClick }) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className={styles.monthCard}>
            <div className={styles.monthTitle}>{format(monthDate, 'MMMM')}</div>
            <div className={styles.dayLabelsRow}>
                {dayLabels.map((l, idx) => <div key={idx} className={styles.dayLabel}>{l}</div>)}
            </div>
            <div className={styles.weeksContainer}>
                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className={styles.weekRow}>
                        {week.map((day, i) => {
                            const meetingCount = scheduledMeetings.filter(m => isSameDay(new Date(m.date), day)).length;
                            return (
                                <div
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); onDayClick(day); }}
                                    className={`${styles.dayCell} ${!isSameMonth(day, monthStart) ? styles.otherMonth : ''
                                        } ${isSameDay(day, today) ? styles.currentDay : ''}`}
                                >
                                    {meetingCount > 0 ? (
                                        <Badge badgeContent={meetingCount} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { fontSize: 8, height: 14, minWidth: 14 } }}>
                                            {format(day, 'd')}
                                        </Badge>
                                    ) : (
                                        format(day, 'd')
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const FullYearCalendar = ({ open, onClose }) => {
    const today = new Date();
    const months = eachMonthOfInterval({ start: startOfYear(today), end: endOfYear(today) });
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [managerDialogOpen, setManagerDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [userData, setUserData] = useState(null);

    const fetchScheduled = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserData(user);
                const res = await axios.get(`${server}/api/v1/scheduled/user`, {
                    params: { userId: user.id }
                });
                setScheduledMeetings(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (open) fetchScheduled();
    }, [open]);

    const handleDayClick = (day) => {
        setSelectedDate(day);
        setScheduleDialogOpen(true);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f1419',
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                    color: '#fff',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                px: 4, py: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon sx={{ color: '#8b5cf6', fontSize: 30 }} />
                    <Box>
                        <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '1px' }}>
                            VIDTALK CALENDAR {format(today, 'yyyy')}
                        </Typography>
                        <Typography variant="caption" color="#666">Manage your professional meetings with smart scheduling</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AssignmentIcon />}
                        onClick={() => setManagerDialogOpen(true)}
                        sx={{ borderColor: '#333', color: '#fff', borderRadius: '10px' }}
                    >
                        View Meetings
                    </Button>
                    <IconButton onClick={onClose} sx={{ color: '#aaa' }}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <div className={styles.fullYearContainer}>
                    {months.map((month, index) => (
                        <MonthView
                            key={index}
                            monthDate={month}
                            today={today}
                            scheduledMeetings={scheduledMeetings}
                            onDayClick={handleDayClick}
                        />
                    ))}
                </div>
            </DialogContent>

            {userData && (
                <>
                    <ScheduleMeeting
                        open={scheduleDialogOpen}
                        onClose={() => setScheduleDialogOpen(false)}
                        selectedDate={selectedDate}
                        userData={userData}
                        onMeetingScheduled={fetchScheduled}
                    />
                    <MeetingManager
                        open={managerDialogOpen}
                        onClose={() => setManagerDialogOpen(false)}
                        userData={userData}
                    />
                </>
            )}
        </Dialog>
    );
};

export { CalendarWidget, FullYearCalendar };
