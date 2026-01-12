import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Badge,
    Button,
    Menu
} from '@mui/material';
import {
    Videocam as VideocamIcon,
    VideocamOff as VideocamOffIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    ScreenShare as ScreenShareIcon,
    StopScreenShare as StopScreenShareIcon,
    Chat as ChatIcon,
    People as PeopleIcon,
    CallEnd as CallEndIcon,
    PanTool as HandIcon,
    ThumbUp as ThumbUpIcon,
    PowerSettingsNew as PowerIcon,
    FiberManualRecord as RecordIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    DragIndicator as DragIcon,
    Star as StarIcon
} from '@mui/icons-material';
import styles from '../styles/VideoMeet_ProfessionalUI.module.css';

export default function VideoMeet_ProfessionalUI({
    // State & Ref
    videos,
    page,
    setPage,
    pageSize,
    localVideoref,
    selfViewPosition,
    isDragging,
    selfViewRef,
    // Handlers
    handleDragStart,
    handleVideo,
    handleAudio,
    handleScreen,
    handleEndCall,
    handleEndMeetingForAll,
    handleHandToggle,
    handleReaction,
    toggleSidebar,
    startRecording,
    stopRecording,
    // Values
    video,
    audio,
    screen,
    screenAvailable,
    isHost,
    unreadMessages,
    participantsCount,
    handRaised,
    activeTab,
    showChat,
    reactionAnchorEl,
    setReactionAnchorEl,
    activeReactions,
    raisedHands,
    hostId,
    username,
    isRecording,
    isConnecting
}) {
    return (
        <>
            <div className={`${styles.conferenceView} ${showChat ? styles.conferenceViewShifted : ''}`} data-grid={videos.slice(page * pageSize, (page + 1) * pageSize).length || 1}>

                {/* Pagination Controls */}
                {videos.length > pageSize && (
                    <>
                        <IconButton
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            sx={{
                                position: 'absolute',
                                left: 20,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                '&:disabled': { opacity: 0.3 }
                            }}
                        >
                            <NavigateBeforeIcon fontSize="large" />
                        </IconButton>
                        <IconButton
                            onClick={() => setPage(p => Math.min(Math.ceil(videos.length / pageSize) - 1, p + 1))}
                            disabled={page >= Math.ceil(videos.length / pageSize) - 1}
                            sx={{
                                position: 'absolute',
                                right: 20,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                '&:disabled': { opacity: 0.3 }
                            }}
                        >
                            <NavigateNextIcon fontSize="large" />
                        </IconButton>
                    </>
                )}

                {videos.length === 0 ? (
                    <div className={styles.waitingContainer}>
                        <Box sx={{ textAlign: 'center', animation: 'pulse 2s infinite' }}>
                            <VideocamIcon sx={{ fontSize: 64, color: 'rgba(139, 92, 246, 0.3)', mb: 3 }} />
                            <Typography variant="h5" sx={{ color: '#e2e8f0', mb: 2, fontWeight: 500 }}>
                                {isConnecting ? 'Connecting...' : 'Waiting for others to join'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: '400px', mx: 'auto' }}>
                                Share this link to invite participants to the meeting
                            </Typography>
                            <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 2, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <Typography variant="caption" sx={{ color: '#8b5cf6', wordBreak: 'break-all' }}>
                                    {window.location.href}
                                </Typography>
                            </Box>
                        </Box>
                    </div>
                ) : (
                    videos.slice(page * pageSize, (page + 1) * pageSize).map((videoItem) => (
                        <div key={videoItem.socketId} className={styles.remoteVideoContainer} style={{ position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 1 }}>
                                {videoItem.username === hostId && (
                                    <Tooltip title="Meeting Host">
                                        <Box sx={{ bgcolor: '#f59e0b', p: 0.5, borderRadius: '4px', display: 'flex' }}>
                                            <StarIcon sx={{ fontSize: 16, color: 'white' }} />
                                        </Box>
                                    </Tooltip>
                                )}
                            </Box>

                            {raisedHands[videoItem.socketId] && (
                                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10, bgcolor: 'rgba(0,0,0,0.6)', p: 1, borderRadius: '50%' }}>
                                    <HandIcon sx={{ color: '#fbbf24' }} />
                                </Box>
                            )}

                            {activeReactions[videoItem.socketId] && (
                                <div className={styles.floatingReaction}>
                                    {activeReactions[videoItem.socketId].emoji}
                                </div>
                            )}

                            <video
                                ref={ref => {
                                    if (ref && videoItem.stream && ref.srcObject !== videoItem.stream) {
                                        ref.srcObject = videoItem.stream;
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted={false}
                                className={styles.remoteVideo}
                            />
                            <div className={styles.userNameTag}>{videoItem.username}</div>
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
                        <VideocamOffIcon sx={{ fontSize: 40 }} />
                    </div>
                )}
                {!audio && (
                    <div className={styles.audioOffIndicator}>
                        <MicOffIcon sx={{ fontSize: 40 }} />
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

                <Tooltip title="Chat" arrow>
                    <Badge badgeContent={unreadMessages} max={99} color="error">
                        <IconButton
                            onClick={() => toggleSidebar('chat')}
                            className={`${styles.controlButton} ${showChat && activeTab === 'chat' ? styles.controlButtonActive : ''}`}
                        >
                            <ChatIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>

                <Tooltip title="Participants" arrow>
                    <Badge badgeContent={participantsCount} color="primary">
                        <IconButton
                            onClick={() => toggleSidebar('members')}
                            className={`${styles.controlButton} ${showChat && activeTab === 'members' ? styles.controlButtonActive : ''}`}
                        >
                            <PeopleIcon />
                        </IconButton>
                    </Badge>
                </Tooltip>

                <Menu
                    anchorEl={reactionAnchorEl}
                    open={Boolean(reactionAnchorEl)}
                    onClose={() => setReactionAnchorEl(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ mb: 2 }}
                >
                    <Box sx={{ display: 'flex', p: 1, gap: 1 }}>
                        <IconButton onClick={() => handleReaction('👍')}>👍</IconButton>
                        <IconButton onClick={() => handleReaction('❤️')}>❤️</IconButton>
                        <IconButton onClick={() => handleReaction('😂')}>😂</IconButton>
                        <IconButton onClick={() => handleReaction('🎉')}>🎉</IconButton>
                    </Box>
                </Menu>

                <Tooltip title="Raise/Lower Hand" arrow>
                    <IconButton
                        onClick={handleHandToggle}
                        className={styles.controlButton}
                        sx={{
                            backgroundColor: handRaised ? '#fbbf24' : 'transparent',
                            color: handRaised ? '#000' : '#fff',
                            '&:hover': { backgroundColor: handRaised ? '#f59e0b' : 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <HandIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Reactions" arrow>
                    <IconButton
                        onClick={(e) => setReactionAnchorEl(e.currentTarget)}
                        className={styles.controlButton}
                    >
                        <ThumbUpIcon />
                    </IconButton>
                </Tooltip>

                <div className={styles.endCallWrapper}>
                    {isHost && (
                        <Tooltip title="End Meeting for All" arrow>
                            <Box>
                                <Button
                                    onClick={handleEndMeetingForAll}
                                    variant="contained"
                                    color="error"
                                    sx={{ mr: 2, borderRadius: 10, px: 3, fontWeight: 'bold', display: { xs: 'none', sm: 'flex' } }}
                                >
                                    End Meeting
                                </Button>
                                <IconButton
                                    onClick={handleEndMeetingForAll}
                                    sx={{ background: '#ef4444', '&:hover': { background: '#dc2626' }, display: { xs: 'flex', sm: 'none' }, mr: 1, color: 'white' }}
                                >
                                    <PowerIcon />
                                </IconButton>
                            </Box>
                        </Tooltip>
                    )}

                    {isHost && (
                        <Tooltip title={isRecording ? "Stop Recording" : "Record Meeting"} arrow>
                            <IconButton
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`${styles.controlButton} ${isRecording ? styles.recordingActive : ''}`}
                                sx={{
                                    background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    '&:hover': { background: isRecording ? '#dc2626' : 'linear-gradient(135deg, #2563eb, #7c3aed)', transform: 'scale(1.1)' }
                                }}
                            >
                                <RecordIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Leave Meeting" arrow>
                        <IconButton
                            onClick={handleEndCall}
                            className={styles.endCallButton}
                            sx={{
                                background: isHost ? '#475569' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                '&:hover': { background: isHost ? '#64748b' : 'linear-gradient(135deg, #dc2626, #b91c1c)', transform: 'scale(1.1)' }
                            }}
                        >
                            <CallEndIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </>
    );
}
