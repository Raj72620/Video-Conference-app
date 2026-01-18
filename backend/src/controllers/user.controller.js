import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    console.log("Login Request Body:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide Username and Password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();

            return res.status(httpStatus.OK).json({
                token: token,
                user: {
                    name: user.name || user.username || "User", // Fallback if name is missing
                    username: user.username,
                    email: user.username
                }
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }
    } catch (e) {
        console.error("Login error:", e);
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
}

const register = async (req, res) => {
    console.log("Register Request Body:", req.body);
    const { name, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(httpStatus.CREATED).json({
            message: "User Registered Successfully",
            user: {
                name: name,
                username: username,
                email: username
            }
        });
    } catch (e) {
        console.error("Registration error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meetings = await Meeting.find({ user_id: user.username }).sort({ date: -1 });

        // Map through meetings and fetch details from the 'Master' meeting (where host started it)
        const enhancedMeetings = await Promise.all(meetings.map(async (historyEntry) => {
            try {
                // Determine if this history entry IS the master entry
                const currentCode = historyEntry.meetingCode;

                if (historyEntry.host_id) {
                    return {
                        ...historyEntry.toObject(),
                        hostName: historyEntry.host_id,
                        isEnded: historyEntry.isEnded
                    };
                }

                // Find the master meeting (created by host)
                // We use a case-insensitive exact match safely
                const masterMeeting = await Meeting.findOne({
                    meetingCode: { $regex: `^${currentCode}$`, $options: 'i' },
                    host_id: { $exists: true }
                }).sort({ date: -1 });

                if (masterMeeting) {
                    return {
                        ...historyEntry.toObject(),
                        hostName: masterMeeting.host_id,
                        isEnded: masterMeeting.isEnded,
                        startTime: masterMeeting.startTime,
                        endTime: masterMeeting.endTime
                    };
                }

                return {
                    ...historyEntry.toObject(),
                    hostName: "Unknown",
                    isEnded: true // accurate fallback
                };
            } catch (err) {
                console.error("Error processing history entry:", err);
                return {
                    ...historyEntry.toObject(),
                    hostName: "Unknown",
                    isEnded: true
                };
            }
        }));

        res.json(enhancedMeetings);
    } catch (e) {
        console.error("Get history error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        console.error("Add to history error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
}

const deleteHistory = async (req, res) => {
    const { meetingId } = req.params;
    const { token } = req.query;

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }

        const meeting = await Meeting.findOneAndDelete({
            _id: meetingId,
            user_id: user.username
        });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found or not authorized" });
        }

        res.status(httpStatus.OK).json({ message: "Meeting deleted successfully" });
    } catch (e) {
        console.error("Delete meeting error:", e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Error: ${e.message}` });
    }
}

export { login, register, getUserHistory, addToHistory, deleteHistory };