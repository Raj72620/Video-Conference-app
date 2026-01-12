import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Avatar,
    TextField,
    Tooltip,
} from '@mui/material';
import {
    Chat as ChatIcon,
    People as PeopleIcon,
    Close as CloseIcon,
    Send as SendIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    PanTool as HandIcon
} from '@mui/icons-material';
import styles from '../styles/VideoMeet_Sidebar.module.css';

export default function VideoMeet_Sidebar({
    showChat,
    setShowChat,
    activeTab,
    setActiveTab,
    messages,
    message,
    setMessage,
    unreadMessages,
    participants,
    raisedHands,
    isHost,
    socketIdRef,
    handleKickUser,
    sendMessage,
    handleKeyPress,
    username,
    hostId,
    formatTime,
    messageInputRef,
    chatContainerRef
}) {
    return (
        <div
            ref={chatContainerRef}
            className={`${styles.chatRoom} ${showChat ? styles.active : ''}`}
        >
            <div className={styles.chatContainer}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderContent}>
                        {activeTab === 'chat' ? (
                            <ChatIcon sx={{ color: '#8b5cf6', mr: 1.5 }} />
                        ) : (
                            <PeopleIcon sx={{ color: '#8b5cf6', mr: 1.5 }} />
                        )}
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                            {activeTab === 'chat' ? 'In-Call Messages' : 'Participants'}
                        </Typography>
                    </div>
                    <IconButton
                        onClick={() => setShowChat(false)}
                        sx={{
                            color: '#94a3b8',
                            '&:hover': {
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </div>

                {/* Chat Messages */}
                {activeTab === 'chat' && (
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
                )}

                {/* Members List */}
                {activeTab === 'members' && (
                    <div className={styles.chattingDisplay}>
                        {participants.map((p) => {
                            const isParticipantHost = p.username === hostId;
                            return (
                                <Box key={p.socketId} sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Avatar sx={{ bgcolor: isParticipantHost ? '#f59e0b' : '#3b82f6', width: 32, height: 32, mr: 1.5, fontSize: 14 }}>
                                        {p.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                                            {p.username} {p.socketId === socketIdRef.current && '(You)'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                            {isParticipantHost && (
                                                <Typography variant="caption" sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <StarIcon sx={{ fontSize: 12 }} /> Host
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {raisedHands[p.socketId] && <HandIcon sx={{ color: '#fbbf24', fontSize: 20 }} />}
                                        {isHost && p.socketId !== socketIdRef.current && (
                                            <Tooltip title="Remove User">
                                                <IconButton size="small" onClick={() => handleKickUser(p.socketId)} sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                            )
                        })}
                    </div>
                )}

                {/* Chat Input */}
                {activeTab === 'chat' && (
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
                                    '& fieldset': { borderColor: '#475569' },
                                    '&:hover fieldset': { borderColor: '#8b5cf6' },
                                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
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
                )}
            </div>
        </div>
    );
}
