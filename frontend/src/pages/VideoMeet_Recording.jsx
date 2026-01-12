import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    LinearProgress
} from '@mui/material';
import styles from '../styles/VideoMeet_Recording.module.css';

export default function VideoMeet_Recording({
    uploading,
    uploadProgress
}) {
    return (
        <Dialog open={uploading} className={styles.uploadDialog}>
            <DialogTitle>Saving Recording...</DialogTitle>
            <DialogContent sx={{ minWidth: '300px' }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Please do not close this window. Uploading to secure storage.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                            {`${Math.round(uploadProgress)}%`}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
