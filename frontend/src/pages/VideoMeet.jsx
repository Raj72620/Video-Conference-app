import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import io from "socket.io-client";
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Container,
    Paper,
    Box,
    Typography,
    Avatar,
    InputAdornment,
    Tooltip,
    Fade
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    VideocamOff as VideocamOffIcon,
    CallEnd as CallEndIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    ScreenShare as ScreenShareIcon,
    StopScreenShare as StopScreenShareIcon,
    Chat as ChatIcon,
    Person as PersonIcon,
    MeetingRoom as MeetingRoomIcon,
    DragIndicator as DragIcon,
    Close as CloseIcon,
    Send as SendIcon,
    ExpandLess as ExpandLessIcon,
    FiberManualRecord as RecordIcon
} from '@mui/icons-material';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext.jsx';

const server_url = server;
var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState([]);
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();
    const [showChat, setShowChat] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);
    const [isConnecting, setIsConnecting] = useState(false);

    // Draggable self-view state
    const [selfViewPosition, setSelfViewPosition] = useState({
        x: typeof window !== 'undefined' ? window.innerWidth - 280 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight - 200 : 0
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const selfViewRef = useRef(null);
    const chatContainerRef = useRef(null);
    const messageInputRef = useRef(null);

    // Get userData from Context
    const { userData } = useContext(AuthContext);

    // Initialize username if user is logged in
    useEffect(() => {
        if (userData?.name) {
            setUsername(userData.name);
            setAskForUsername(false);
        }
    }, [userData]);

    // Auto-start if username is set
    useEffect(() => {
        if (userData?.name && askForUsername === false) {
            getMedia();
        }
    }, [askForUsername, userData]);

    // Initialize self-view position on window resize
    useEffect(() => {
        const handleResize = () => {
            setSelfViewPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 260),
                y: Math.min(prev.y, window.innerHeight - 180)
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current && showChat) {
            const chatDisplay = chatContainerRef.current.querySelector('.chattingDisplay');
            if (chatDisplay) {
                chatDisplay.scrollTop = chatDisplay.scrollHeight;
            }
        }
    }, [messages, showChat]);

    // Focus message input when chat opens
    useEffect(() => {
        if (showChat && messageInputRef.current) {
            setTimeout(() => {
                messageInputRef.current?.focus();
            }, 300);
        }
    }, [showChat]);

    // Reset unread messages when chat is opened
    useEffect(() => {
        if (showChat) {
            setUnreadMessages(0);
        }
    }, [showChat]);

    const getDisplayMediaSuccess = useCallback((stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
        }

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            getUserMedia();
        });
    }, []);

    const getDisplayMedia = useCallback(() => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .catch((e) => console.log(e));
            }
        }
    }, [screen, getDisplayMediaSuccess]);

    const getPermissions = useCallback(async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!videoPermission);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!audioPermission);

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoPermission || audioPermission) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.error('Permission error:', error);
            setVideoAvailable(false);
            setAudioAvailable(false);
        }
    }, [videoAvailable, audioAvailable]);

    useEffect(() => {
        getPermissions();
    }, [getPermissions]);

    const getUserMediaSuccess = useCallback((stream) => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) { console.log(e); }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    })
                    .catch(e => console.log(e));
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream);

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            }
        });
    }, []);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen, getDisplayMedia]);

    useEffect(() => {
        if (!askForUsername && localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    const connectToSocketServer = useCallback(() => {
        setIsConnecting(true);
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            setIsConnecting(false);
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', (data, sender, socketIdSender) => {
                addMessage(data, sender, socketIdSender);
            });

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        setVideos(videos => {
                            const existingIndex = videos.findIndex(v => v.socketId === socketListId);
                            if (existingIndex >= 0) {
                                const updatedVideos = [...videos];
                                updatedVideos[existingIndex] = {
                                    ...updatedVideos[existingIndex],
                                    stream: event.stream
                                };
                                return updatedVideos;
                            } else {
                                return [...videos, {
                                    socketId: socketListId,
                                    stream: event.stream,
                                    autoplay: true,
                                    playsinline: true,
                                    username: `User ${socketListId.slice(0, 4)}` // Temporary username
                                }];
                            }
                        });
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });

        socketRef.current.on('connect_error', () => {
            setIsConnecting(false);
            console.error('Connection failed');
        });
    }, []);

    const gotMessageFromServer = useCallback((fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }, []);

    const addMessage = useCallback((data, sender, socketIdSender) => {
        const newMessage = {
            sender: sender,
            data: data,
            timestamp: new Date(),
            id: Date.now() + Math.random(),
            isOwn: socketIdSender === socketIdRef.current
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        if (socketIdSender !== socketIdRef.current && !showChat) {
            setUnreadMessages(prev => prev + 1);
        }
    }, [showChat, socketIdRef]);

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const handleVideo = () => {
        setVideo(!video);
    };

    const handleAudio = () => {
        setAudio(!audio);
    };

    const handleScreen = () => {
        setScreen(!screen);
    };

    const handleEndCall = () => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
            if (localVideoref.current?.srcObject) {
                localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch (e) { }
        window.location.href = "/home";
    };

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('chat-message', message.trim(), username);
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        const newShowChat = !showChat;
        setShowChat(newShowChat);
        if (newShowChat) {
            setUnreadMessages(0);
        }
    };

    const getMedia = useCallback(() => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }, [videoAvailable, audioAvailable, connectToSocketServer]);

    const connect = () => {
        if (username.trim()) {
            setAskForUsername(false);
            getMedia();
        }
    };

    // Draggable Self-View Logic
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        dragStartPos.current = {
            x: clientX - selfViewPosition.x,
            y: clientY - selfViewPosition.y
        };

        document.body.style.userSelect = 'none';
    };

    const handleDragMove = useCallback((clientX, clientY) => {
        if (!isDragging || !selfViewRef.current) return;

        const containerWidth = selfViewRef.current.offsetWidth;
        const containerHeight = selfViewRef.current.offsetHeight;

        let newX = clientX - dragStartPos.current.x;
        let newY = clientY - dragStartPos.current.y;

        // Constrain within viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - containerWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - containerHeight - 80));

        setSelfViewPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.body.style.userSelect = '';
    }, []);

    // Event listeners for dragging
    useEffect(() => {
        const handleMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        const handleMouseUp = () => handleDragEnd();
        const handleTouchEnd = () => handleDragEnd();

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Format time for chat messages
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.videoMeetContainer}>
            {askForUsername === true ? (
                <Container maxWidth="sm" sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    py: 4,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                }}>
                    <Paper elevation={24} sx={{
                        p: 4,
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: 4,
                        textAlign: 'center',
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Box sx={{ mb: 4 }}>
                            <Avatar sx={{
                                bgcolor: 'primary.main',
                                width: 80,
                                height: 80,
                                margin: '0 auto 20px',
                                background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)'
                            }}>
                                <MeetingRoomIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h4" component="h2" sx={{
                                fontWeight: 700,
                                mb: 2,
                                color: '#ffffff',
                                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Join Video Conference
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                                Enter your name to join the meeting
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            mb: 4
                        }}>
                            <TextField
                                fullWidth
                                label="Your Name"
                                variant="outlined"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && connect()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: '#8b5cf6' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                        color: '#ffffff',
                                        '& fieldset': {
                                            borderColor: '#475569',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#8b5cf6',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3b82f6',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#94a3b8',
                                    },
                                }}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={connect}
                                disabled={!username.trim()}
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(100, 116, 139, 0.5)',
                                    }
                                }}
                                startIcon={<VideocamIcon />}
                            >
                                Join Meeting
                            </Button>
                        </Box>

                        <Box sx={{
                            mt: 4,
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: 3,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            position: 'relative'
                        }}>
                            <video
                                ref={localVideoref}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    display: 'block',
                                    transform: 'scaleX(-1)'
                                }}
                            />
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                p: 2
                            }}>
                                <Typography variant="caption" sx={{ color: '#ffffff' }}>
                                    Camera Preview
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Chat Icon - Floating Top Right */}
                    <div className={styles.chatIconContainer}>
                        <Fade in={!showChat}>
                            <Badge
                                badgeContent={unreadMessages}
                                max={99}
                                color="error"
                                overlap="circular"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        animation: unreadMessages > 0 ? 'pulse 2s infinite' : 'none'
                                    }
                                }}
                            >
                                <IconButton
                                    onClick={toggleChat}
                                    className={styles.chatIconButton}
                                    size="large"
                                    sx={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Fade>
                    </div>

                    {/* Chat Panel - Modern Sidebar */}
                    <div
                        ref={chatContainerRef}
                        className={`${styles.chatRoom} ${showChat ? styles.active : ''}`}
                    >
                        <div className={styles.chatContainer}>
                            {/* Chat Header */}
                            <div className={styles.chatHeader}>
                                <div className={styles.chatHeaderContent}>
                                    <ChatIcon sx={{ color: '#8b5cf6', mr: 1.5 }} />
                                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                                        Meeting Chat
                                    </Typography>
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <RecordIcon sx={{ fontSize: 12, color: '#10b981' }} />
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            {videos.length + 1} online
                                        </Typography>
                                    </Box>
                                </div>
                                <IconButton
                                    onClick={toggleChat}
                                    sx={{
                                        color: '#94a3b8',
                                        '&:hover': {
                                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                            color: '#8b5cf6'
                                        }
                                    }}
                                    size="small"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            {/* Chat Messages */}
                            <div className={styles.chattingDisplay}>
                                <div className={styles.welcomeMessage}>
                                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                                        {username} joined the meeting
                                    </Typography>
                                </div>

                                {messages.map((item) => (
                                    <div
                                        className={`${styles.messageBlock} ${item.isOwn ? styles.self : styles.others}`}
                                        key={item.id}
                                    >
                                        {!item.isOwn && (
                                            <div className={styles.messageHeader}>
                                                <Avatar
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        bgcolor: item.isOwn ? '#8b5cf6' : '#3b82f6',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {item.sender.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="caption" className={styles.messageSender}>
                                                    {item.sender}
                                                </Typography>
                                            </div>
                                        )}
                                        <div className={styles.messageBubble}>
                                            <Typography variant="body2" className={styles.messageContent}>
                                                {item.data}
                                            </Typography>
                                        </div>
                                        <Typography variant="caption" className={styles.messageTime}>
                                            {formatTime(item.timestamp)}
                                        </Typography>
                                    </div>
                                ))}

                                {messages.length === 0 && (
                                    <div className={styles.emptyChat}>
                                        <ChatIcon sx={{ fontSize: 48, color: '#475569', mb: 2, opacity: 0.5 }} />
                                        <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
                                            No messages yet
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            Start a conversation!
                                        </Typography>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className={styles.chattingArea}>
                                <TextField
                                    inputRef={messageInputRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    multiline
                                    maxRows={3}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                            borderRadius: 2,
                                            color: '#ffffff',
                                            '& fieldset': {
                                                borderColor: '#475569',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#8b5cf6',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#8b5cf6',
                                            },
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            color: '#64748b',
                                            opacity: 1,
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    sx={{
                                        backgroundColor: '#8b5cf6',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#7c3aed',
                                            transform: 'scale(1.05)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#475569',
                                            color: '#64748b'
                                        }
                                    }}
                                >
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>

                    {/* Main Conference Grid */}
                    <div className={styles.conferenceView} data-grid={videos.length || 1}>
                        {videos.length === 0 ? (
                            <div className={styles.waitingContainer}>
                                <Box sx={{
                                    textAlign: 'center',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    <VideocamIcon sx={{
                                        fontSize: 64,
                                        color: 'rgba(139, 92, 246, 0.3)',
                                        mb: 3
                                    }} />
                                    <Typography variant="h5" sx={{
                                        color: '#e2e8f0',
                                        mb: 2,
                                        fontWeight: 500
                                    }}>
                                        {isConnecting ? 'Connecting...' : 'Waiting for others to join'}
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: '#94a3b8',
                                        maxWidth: '400px',
                                        mx: 'auto'
                                    }}>
                                        Share this link to invite participants to the meeting
                                    </Typography>
                                    <Box sx={{
                                        mt: 3,
                                        p: 2,
                                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(139, 92, 246, 0.2)'
                                    }}>
                                        <Typography variant="caption" sx={{
                                            color: '#8b5cf6',
                                            wordBreak: 'break-all'
                                        }}>
                                            {window.location.href}
                                        </Typography>
                                    </Box>
                                </Box>
                            </div>
                        ) : (
                            videos.map((videoItem) => (
                                <div key={videoItem.socketId} className={styles.remoteVideoContainer}>
                                    <video
                                        ref={ref => {
                                            if (ref && videoItem.stream && ref.srcObject !== videoItem.stream) {
                                                ref.srcObject = videoItem.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                        className={styles.remoteVideo}
                                    />
                                    <div className={styles.videoOverlay}>
                                        <Typography variant="caption" className={styles.videoUsername}>
                                            {videoItem.username || 'Remote User'}
                                        </Typography>
                                        {!audio && (
                                            <MicOffIcon sx={{ fontSize: 16, ml: 1 }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Draggable Self-View */}
                    <div
                        ref={selfViewRef}
                        className={`${styles.draggableSelfView} ${isDragging ? styles.dragging : ''}`}
                        style={{
                            left: `${selfViewPosition.x}px`,
                            top: `${selfViewPosition.y}px`,
                            touchAction: 'none'
                        }}
                    >
                        <div
                            className={styles.dragHandle}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        >
                            <DragIcon className={styles.dragIcon} />
                            <Typography variant="caption" className={styles.selfViewLabel}>
                                You • {username}
                            </Typography>
                        </div>
                        <video
                            ref={localVideoref}
                            autoPlay
                            muted
                            playsInline
                            className={styles.selfVideo}
                        />
                        {!video && (
                            <div className={styles.videoOffIndicator}>
                                <VideocamOffIcon />
                            </div>
                        )}
                        {!audio && (
                            <div className={styles.audioOffIndicator}>
                                <MicOffIcon />
                            </div>
                        )}
                    </div>

                    {/* Floating Control Bar */}
                    <div className={styles.floatingControls}>
                        <Tooltip title={video ? "Turn off camera" : "Turn on camera"} arrow>
                            <IconButton
                                onClick={handleVideo}
                                className={`${styles.controlButton} ${!video ? styles.controlButtonOff : ''}`}
                                sx={{
                                    background: video ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#475569',
                                    '&:hover': {
                                        background: video ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#64748b',
                                        transform: 'scale(1.1)'
                                    }
                                }}
                            >
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"} arrow>
                            <IconButton
                                onClick={handleAudio}
                                className={`${styles.controlButton} ${!audio ? styles.controlButtonOff : ''}`}
                                sx={{
                                    background: audio ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#475569',
                                    '&:hover': {
                                        background: audio ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#64748b',
                                        transform: 'scale(1.1)'
                                    }
                                }}
                            >
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"} arrow>
                                <IconButton
                                    onClick={handleScreen}
                                    className={`${styles.controlButton} ${screen ? styles.controlButtonActive : ''}`}
                                    sx={{
                                        background: screen ? '#10b981' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        '&:hover': {
                                            background: screen ? '#059669' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Toggle chat" arrow>
                            <Badge
                                badgeContent={unreadMessages}
                                max={99}
                                color="error"
                                className={styles.chatBadge}
                            >
                                <IconButton
                                    onClick={toggleChat}
                                    className={styles.controlButton}
                                    sx={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        <div className={styles.endCallWrapper}>
                            <Tooltip title="End call for everyone" arrow>
                                <IconButton
                                    onClick={handleEndCall}
                                    className={styles.endCallButton}
                                    sx={{
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                            transform: 'scale(1.1)'
                                        }
                                    }}
                                >
                                    <CallEndIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}