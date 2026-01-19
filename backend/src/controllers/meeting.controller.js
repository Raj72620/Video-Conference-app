import httpStatus from "http-status";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

const startMeeting = async (req, res) => {
    const { meetingCode, password, token } = req.body;
    // Enforce consistency
    const cleanMeetingCode = meetingCode ? meetingCode.toUpperCase().trim() : meetingCode;

    if (!meetingCode) {
        return res.status(400).json({ message: "Meeting code is required" });
    }

    try {
        if (!token) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User token is required to start a meeting" });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid session. Please login again." });
        }

        const existingMeeting = await Meeting.findOne({ meetingCode: cleanMeetingCode, isEnded: false });
        if (existingMeeting) {
            return res.status(httpStatus.CONFLICT).json({ message: "Meeting code already active" });
        }

        const newMeeting = new Meeting({
            meetingCode: cleanMeetingCode,
            password,
            user_id: user.username,
            host_id: user.username,
            startTime: new Date()
        });

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Meeting started successfully", meeting: newMeeting });

    } catch (e) {
        console.error("Start meeting error:", e);
        res.status(500).json({ message: `Error: ${e.message}` });
    }
}

const validateMeeting = async (req, res) => {
    const { meetingCode, password } = req.body;
    const cleanMeetingCode = meetingCode ? meetingCode.toUpperCase().trim() : meetingCode;

    try {
        const meeting = await Meeting.findOne({ meetingCode: cleanMeetingCode, isEnded: false });

        if (!meeting) {
            // Check if it was ended
            const endedMeeting = await Meeting.findOne({ meetingCode: cleanMeetingCode, isEnded: true });
            if (endedMeeting) {
                return res.status(400).json({ message: "This session has expired" });
            }
            return res.status(404).json({ message: "Meeting not found" });
        }

        if (meeting.password && meeting.password !== password) {
            return res.status(401).json({ message: "Invalid password" });
        }

        res.status(httpStatus.OK).json({ message: "Meeting is valid", meeting });

    } catch (e) {
        console.error("Validate meeting error:", e);
        res.status(500).json({ message: `Error: ${e.message}` });
    }
}

const checkMeetingStatus = async (req, res) => {
    const { meetingCode } = req.params;
    try {
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) return res.status(404).json({ message: "Not found" });
        res.json({
            isEnded: meeting.isEnded,
            hostId: meeting.host_id,
            startTime: meeting.startTime
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

const endMeeting = async (req, res) => {
    const { meetingCode, token } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meeting = await Meeting.findOne({ meetingCode, isEnded: false });

        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found or already ended" });
        }

        // Verify if user is host
        if (meeting.host_id !== user.username) {
            return res.status(httpStatus.FORBIDDEN).json({ message: "Only host can end the meeting" });
        }

        meeting.isEnded = true;
        meeting.endTime = new Date();
        await meeting.save();

        res.status(httpStatus.OK).json({ message: "Meeting ended successfully" });

    } catch (e) {
        console.error("End meeting error:", e);
        res.status(500).json({ message: `Error: ${e.message}` });
    }
}

export { startMeeting, validateMeeting, checkMeetingStatus, endMeeting };
