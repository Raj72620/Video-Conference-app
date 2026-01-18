import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";
import axios from 'axios';
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
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    Person as PersonIcon,
    MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';

import { Alert, Snackbar } from '@mui/material';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext.jsx';

// Import newly created sub-components
import VideoMeet_Sidebar from './VideoMeet_Sidebar';
import VideoMeet_Recording from './VideoMeet_Recording';
import VideoMeet_ProfessionalUI from './VideoMeet_ProfessionalUI';

const server_url = server;
var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    const { url: meetingCodeParam } = useParams();
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
    const [videos, setVideos] = useState([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [meetingCode, setMeetingCode] = useState("");
    const [hostId, setHostId] = useState(null);
    const [activeTab, setActiveTab] = useState('chat');
    const [handRaised, setHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState({});
    const [participants, setParticipants] = useState([]);

    // Reaction State
    const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
    const [activeReactions, setActiveReactions] = useState({}); // socketId -> emoji

    // Notifications & Pagination
    const [notification, setNotification] = useState({ open: false, message: "" });
    const [page, setPage] = useState(0);
    const pageSize = 4;

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

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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
        const code = (meetingCodeParam || window.location.href.split("/").pop()).toUpperCase();
        setMeetingCode(code);

        const checkMeetingStatus = async () => {
            try {
                const response = await axios.get(`${server}/api/v1/meetings/status/${code}`);
                if (response.data.hostId) setHostId(response.data.hostId);
                if (response.data.isEnded) {
                    alert("This meeting has ended");
                    window.location.href = "/home";
                    return;
                }
                if (userData?.username && response.data.hostId === userData.username) {
                    setIsHost(true);
                }
            } catch (err) {
                console.error("Error fetching meeting status", err);
            }
        };

        checkMeetingStatus();

        if (userData?.name && askForUsername === false) {
            getMedia();
        }
    }, [askForUsername, userData, meetingCodeParam]);

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
            const videoConstraints = {
                width: { max: 640, ideal: 480 },
                height: { max: 480, ideal: 360 },
                frameRate: { max: 20, ideal: 15 },
                aspectRatio: 1.333
            };

            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
            setVideoAvailable(!!videoPermission);

            const audioPermission = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            setAudioAvailable(!!audioPermission);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoPermission || audioPermission) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable ? videoConstraints : false,
                    audio: audioAvailable ? {
                        echoCancellation: true,
                        noiseSuppression: true
                    } : false
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
            const videoConstraints = video ? {
                width: { max: 640, ideal: 480 },
                height: { max: 480, ideal: 360 },
                frameRate: { max: 20, ideal: 15 },
                aspectRatio: 1.333
            } : false;

            navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true
                } : false
            })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }
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
            socketRef.current.emit('join-call', meetingCode, username);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', (data, sender, socketIdSender) => {
                addMessage(data, sender, socketIdSender);
            });

            socketRef.current.on('user-left', (id, leaverName) => {
                const name = leaverName || videos.find(v => v.socketId === id)?.username || "User";
                setNotification({ open: true, message: `${name} left the meeting` });
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                setParticipants(prev => prev.filter(p => p.socketId !== id));
                setRaisedHands(prev => {
                    const newHands = { ...prev };
                    delete newHands[id];
                    return newHands;
                });
            });

            socketRef.current.on('user-joined', (id, clients, roomUsers = []) => {
                setParticipants(roomUsers);
                if (id !== socketIdRef.current) {
                    const joinerName = roomUsers.find(u => u.socketId === id)?.username || "Someone";
                    setNotification({ open: true, message: `${joinerName} joined the meeting` });
                }

                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        const participantName = roomUsers.find(u => u.socketId === socketListId)?.username || `User ${socketListId.slice(0, 4)}`;
                        setVideos(videos => {
                            const existingIndex = videos.findIndex(v => v.socketId === socketListId);
                            if (existingIndex >= 0) {
                                const updatedVideos = [...videos];
                                updatedVideos[existingIndex] = { ...updatedVideos[existingIndex], stream: event.stream, username: participantName };
                                return updatedVideos;
                            } else {
                                return [...videos, { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true, username: participantName }];
                            }
                        });
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                        try {
                            const senders = connections[socketListId].getSenders();
                            senders.forEach((sender) => {
                                if (sender.track && sender.track.kind === 'video') {
                                    const params = sender.getParameters();
                                    if (!params.encodings) params.encodings = [{}];
                                    params.encodings[0].maxBitrate = 200000;
                                    sender.setParameters(params).catch(e => console.log('Bitrate error:', e));
                                }
                            });
                        } catch (e) { }
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
                            const senders = connections[id2].getSenders();
                            senders.forEach((sender) => {
                                if (sender.track && sender.track.kind === 'video') {
                                    const params = sender.getParameters();
                                    if (!params.encodings) params.encodings = [{}];
                                    params.encodings[0].maxBitrate = 200000;
                                    sender.setParameters(params).catch(e => console.log('Bitrate error:', e));
                                }
                            });
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
        });

        socketRef.current.on('user-banned', () => {
            alert("You have been banned from this meeting.");
            window.location.href = "/home";
        });

        socketRef.current.on('kicked', () => {
            alert("The host has removed you from the meeting.");
            window.location.href = "/home";
        });

        socketRef.current.on('hand-update', (id, isRaised) => {
            setRaisedHands(prev => ({ ...prev, [id]: isRaised }));
        });

        socketRef.current.on('reaction-update', (id, emoji) => {
            setActiveReactions(prev => ({ ...prev, [id]: { emoji, id: Date.now() } }));
            setTimeout(() => {
                setActiveReactions(prev => {
                    const newState = { ...prev };
                    if (newState[id] && newState[id].emoji === emoji) delete newState[id];
                    return newState;
                });
            }, 3000);
        });

        socketRef.current.on('meeting-ended', () => {
            alert("The host has ended the meeting.");
            window.location.href = "/home";
        });
    }, [username, videos, meetingCode]);

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
    }, [showChat]);

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

    const handleVideo = () => setVideo(!video);
    const handleAudio = () => setAudio(!audio);
    const handleScreen = () => setScreen(!screen);

    const handleEndCall = () => {
        try {
            if (window.localStream) window.localStream.getTracks().forEach(track => track.stop());
            if (localVideoref.current?.srcObject) localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
            if (socketRef.current) socketRef.current.disconnect();
        } catch (e) { }
        window.location.href = "/home";
    };

    const handleEndMeetingForAll = async () => {
        if (socketRef.current && isHost) {
            try {
                await axios.post(`${server}/api/v1/meetings/end`, {
                    meetingCode: meetingCode,
                    token: localStorage.getItem("token")
                });
            } catch (err) {
                console.error("Failed to mark meeting as ended", err);
            }
            // Use callback to ensure server processes the end event before we disconnect
            socketRef.current.emit('end-meeting', meetingCode, meetingCode, () => {
                handleEndCall();
            });
            // Fallback timeout in case server doesn't respond
            setTimeout(() => {
                if (window.location.pathname !== "/home") handleEndCall();
            }, 2000);
        }
    };

    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('chat-message', message.trim(), username);
            setMessage("");
        }
    };

    const handleHandToggle = () => {
        const newState = !handRaised;
        setHandRaised(newState);
        socketRef.current.emit('toggle-hand', newState, meetingCode);
        setRaisedHands(prev => ({ ...prev, [socketIdRef.current]: newState }));
    };

    const handleReaction = (emoji) => {
        setReactionAnchorEl(null);
        socketRef.current.emit('send-reaction', emoji, meetingCode);
        const myId = socketIdRef.current;
        setActiveReactions(prev => ({ ...prev, [myId]: { emoji, id: Date.now() } }));
        setTimeout(() => {
            setActiveReactions(prev => {
                const newState = { ...prev };
                if (newState[myId]) delete newState[myId];
                return newState;
            });
        }, 3000);
    };

    const handleKickUser = (socketId) => {
        if (window.confirm("Are you sure you want to remove this user?")) {
            socketRef.current.emit('kick-user', socketId, meetingCode);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleSidebar = (targetTab) => {
        if (showChat && activeTab === targetTab) {
            setShowChat(false);
        } else {
            setShowChat(true);
            setActiveTab(targetTab);
            if (targetTab === 'chat') setUnreadMessages(0);
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

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" }, audio: true });
            let audioStream;
            try { audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { }
            const tracks = [...screenStream.getTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])];
            const combinedStream = new MediaStream(tracks);
            const mimeTypes = ['video/webm; codecs=vp9', 'video/webm; codecs=vp8', 'video/webm', 'video/mp4'];
            let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
            const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
            const mediaRecorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data); };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType || 'video/webm' });
                await uploadRecording(blob);
                combinedStream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };
            screenStream.getVideoTracks()[0].onended = () => { if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); };
            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (err) { alert("Failed to start recording."); }
    };

    const stopRecording = () => { if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop(); };

    const uploadRecording = async (blob) => {
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('video', blob, 'recording.webm');
        formData.append('hostId', userData.username);
        formData.append('meetingCode', meetingCode);
        try {
            await axios.post(`${server}/api/v1/recordings/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
            });
            alert("Recording saved to your profile!");
        } catch (error) { alert("Failed to upload recording."); } finally { setUploading(false); }
    };

    // Draggable Logic
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        dragStartPos.current = { x: clientX - selfViewPosition.x, y: clientY - selfViewPosition.y };
        document.body.style.userSelect = 'none';
    };

    const handleDragMove = useCallback((clientX, clientY) => {
        if (!isDragging || !selfViewRef.current) return;
        const containerWidth = selfViewRef.current.offsetWidth;
        const containerHeight = selfViewRef.current.offsetHeight;
        let newX = Math.max(0, Math.min(clientX - dragStartPos.current.x, window.innerWidth - containerWidth));
        let newY = Math.max(0, Math.min(clientY - dragStartPos.current.y, window.innerHeight - containerHeight - 80));
        setSelfViewPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
        const handleTouchMove = (e) => { if (e.touches.length === 1) { e.preventDefault(); handleDragMove(e.touches[0].clientX, e.touches[0].clientY); } };
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

    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={styles.videoMeetContainer}>
            {askForUsername === true ? (
                <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', py: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                    <Paper elevation={24} sx={{ p: 4, width: '100%', maxWidth: '500px', borderRadius: 4, textAlign: 'center', backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Box sx={{ mb: 4 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)' }}>
                                <MeetingRoomIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2, color: '#ffffff', background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Join Video Conference</Typography>
                            <Typography variant="body1" sx={{ color: '#94a3b8' }}>Enter your name to join the meeting</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
                            <TextField fullWidth label="Your Name" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && connect()} InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: '#8b5cf6' }} /></InputAdornment>) }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#ffffff', '& fieldset': { borderColor: '#475569' }, '&:hover fieldset': { borderColor: '#8b5cf6' } }, '& .MuiInputLabel-root': { color: '#94a3b8' } }} />
                            <Button fullWidth variant="contained" size="large" onClick={connect} disabled={!username.trim()} sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600, background: 'linear-gradient(45deg, #3b82f6 30%, #8b5cf6 90%)', '&:hover': { background: 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)', translateY: '-2px', boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' } }} startIcon={<VideocamIcon />}>Join Meeting</Button>
                        </Box>
                        <Box sx={{ mt: 4, borderRadius: 3, overflow: 'hidden', boxShadow: 3, border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
                            <video ref={localVideoref} autoPlay muted playsInline style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                        </Box>
                    </Paper>
                </Container>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {/* Interactive & Collaborative Tools Component */}
                    <VideoMeet_Sidebar
                        showChat={showChat}
                        setShowChat={setShowChat}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        messages={messages}
                        message={message}
                        setMessage={setMessage}
                        unreadMessages={unreadMessages}
                        participants={participants}
                        raisedHands={raisedHands}
                        isHost={isHost}
                        socketIdRef={socketIdRef}
                        handleKickUser={handleKickUser}
                        sendMessage={sendMessage}
                        handleKeyPress={handleKeyPress}
                        username={username}
                        hostId={hostId}
                        formatTime={formatTime}
                        messageInputRef={messageInputRef}
                        chatContainerRef={chatContainerRef}
                    />

                    {/* Professional UI/UX Features Component */}
                    <VideoMeet_ProfessionalUI
                        videos={videos}
                        page={page}
                        setPage={setPage}
                        pageSize={pageSize}
                        localVideoref={localVideoref}
                        selfViewPosition={selfViewPosition}
                        isDragging={isDragging}
                        selfViewRef={selfViewRef}
                        handleDragStart={handleDragStart}
                        handleVideo={handleVideo}
                        handleAudio={handleAudio}
                        handleScreen={handleScreen}
                        handleEndCall={handleEndCall}
                        handleEndMeetingForAll={handleEndMeetingForAll}
                        handleHandToggle={handleHandToggle}
                        handleReaction={handleReaction}
                        toggleSidebar={toggleSidebar}
                        startRecording={startRecording}
                        stopRecording={stopRecording}
                        video={video}
                        audio={audio}
                        screen={screen}
                        screenAvailable={screenAvailable}
                        isHost={isHost}
                        unreadMessages={unreadMessages}
                        participantsCount={participants.length}
                        handRaised={handRaised}
                        activeTab={activeTab}
                        showChat={showChat}
                        reactionAnchorEl={reactionAnchorEl}
                        setReactionAnchorEl={setReactionAnchorEl}
                        activeReactions={activeReactions}
                        raisedHands={raisedHands}
                        hostId={hostId}
                        username={username}
                        isRecording={isRecording}
                        isConnecting={isConnecting}
                        socketId={socketIdRef.current}
                    />

                    {/* Integrated Recording Manager */}
                    <VideoMeet_Recording
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                    />

                    {/* Global Notifications */}
                    <Snackbar
                        open={notification.open}
                        autoHideDuration={3000}
                        onClose={() => setNotification({ ...notification, open: false })}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert severity="info" variant="filled" sx={{ width: '100%', bgcolor: 'rgba(30, 41, 59, 0.9)', color: '#fff' }}>
                            {notification.message}
                        </Alert>
                    </Snackbar>
                </div>
            )}
        </div>
    );
}