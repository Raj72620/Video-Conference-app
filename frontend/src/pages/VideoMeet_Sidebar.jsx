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

                        {messages.map((item) => {
                            const isOwn = item.isOwn;
                            return (
                                <div
                                    className={`${styles.messageBlock} ${isOwn ? styles.self : styles.others}`}
                                    key={item.id}
                                >
                                    <div className={styles.messageBubble}>
                                        {!isOwn && (
                                            <div className={styles.messageSender}>
                                                {item.sender}
                                            </div>
                                        )}

                                        {/* Reply Preview (Optional Future) */}
                                        {/* {item.replyTo && <div className={styles.replyPreview}>...</div>} */}

                                        <Typography variant="body2" className={styles.messageContent} style={{ color: isOwn ? '#fff' : '#1e1e1e' }}>
                                            {item.data}
                                        </Typography>

                                        <div className={styles.messageTime}>
                                            {formatTime(item.timestamp)}
                                        </div>
                                    </div>

                                    {/* Action Helper (Hover Context) - could go here */}
                                </div>
                            );
                        })}

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
                        <div ref={el => {
                            if (el && activeTab === 'chat') {
                                el.scrollIntoView({ behavior: 'smooth' });
                            }
                        }} />
                    </div>
                )}

                {/* Members List */}
                {activeTab === 'members' && (
                    <div className={styles.chattingDisplay}>
                        {participants.map((p) => {
                            const isParticipantHost = p.username === hostId;
                            const isMe = p.socketId === socketIdRef.current;

                            return (
                                <div key={p.socketId} className={styles.participantItem}>
                                    <Avatar
                                        sx={{
                                            bgcolor: isParticipantHost ? '#f59e0b' : '#3b82f6',
                                            width: 36,
                                            height: 36,
                                            fontSize: 15,
                                            fontWeight: 600
                                        }}
                                    >
                                        {p.username.charAt(0).toUpperCase()}
                                    </Avatar>

                                    <div className={styles.participantInfo}>
                                        <div className={styles.participantName}>
                                            {p.username} {isMe && '(You)'}
                                        </div>
                                        {isParticipantHost && (
                                            <div className={styles.participantRole}>
                                                <StarIcon sx={{ fontSize: 14 }} /> Host
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.participantActions}>
                                        {raisedHands[p.socketId] && (
                                            <Tooltip title="Raised Hand">
                                                <HandIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
                                            </Tooltip>
                                        )}
                                        {isHost && !isMe && (
                                            <Tooltip title="Remove User">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleKickUser(p.socketId)}
                                                    sx={{
                                                        color: '#ef4444',
                                                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            );
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
