
import { Recording } from "../models/recording.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Filename: recording-[meetingCode]-[timestamp].webm
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

export const uploadMiddleware = upload.single('video');

export const saveRecordingReference = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No video file uploaded" });
        }

        const { hostId, meetingCode, duration } = req.body;

        // Construct public URL
        // Assuming app serves 'public' folder or 'uploads' route
        const videoUrl = `/uploads/${req.file.filename}`;

        const newRecording = new Recording({
            host_id: hostId,
            meetingCode: meetingCode,
            videoUrl: videoUrl,
            size: req.file.size,
            duration: duration || "00:00"
        });

        await newRecording.save();

        res.status(201).json({ message: "Recording saved successfully", recording: newRecording });

    } catch (error) {
        console.error("Save recording error:", error);
        res.status(500).json({ message: "Failed to save recording" });
    }
};

export const getUserRecordings = async (req, res) => {
    try {
        const { username } = req.query; // Or from auth token
        const recordings = await Recording.find({ host_id: username }).sort({ date: -1 });
        res.json(recordings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteRecording = async (req, res) => {
    try {
        const { id } = req.params;
        const recording = await Recording.findById(id);

        if (!recording) return res.status(404).json({ message: "Recording not found" });

        // Delete file from fs
        const filePath = path.join(uploadDir, path.basename(recording.videoUrl));

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Recording.findByIdAndDelete(id);
        res.json({ message: "Recording deleted" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
