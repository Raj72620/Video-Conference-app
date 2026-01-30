import { ScheduledMeeting } from "../models/scheduledMeeting.model.js";
import httpStatus from "http-status";

export const scheduleMeeting = async (req, res) => {
    try {
        const { meetingCode, password, date, startTime, duration, hostName, description } = req.body;
        // In this app, the user id seems to be coming differently, checking other controllers
        // Let's assume req.query.token or similar if not using standard auth middleware
        // But the requirement says host must be able to manage. 
        // I'll use the username or token to identify.

        const newMeeting = new ScheduledMeeting({
            meetingCode,
            password,
            date,
            startTime,
            duration,
            host: req.body.userId, // Frontend should pass userId or we extract from token
            hostName,
            description
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).send(newMeeting);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

export const getScheduledMeetings = async (req, res) => {
    try {
        const { userId } = req.query;
        const meetings = await ScheduledMeeting.find({ host: userId }).sort({ date: 1, startTime: 1 });
        res.status(httpStatus.OK).send(meetings);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

export const updateScheduledMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const meeting = await ScheduledMeeting.findByIdAndUpdate(id, updates, { new: true });
        if (!meeting) return res.status(httpStatus.NOT_FOUND).send({ message: "Meeting not found" });
        res.status(httpStatus.OK).send(meeting);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

export const cancelMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await ScheduledMeeting.findByIdAndUpdate(id, { status: 'Cancelled' }, { new: true });
        if (!meeting) return res.status(httpStatus.NOT_FOUND).send({ message: "Meeting not found" });
        res.status(httpStatus.OK).send({ message: "Meeting cancelled" });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

export const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await ScheduledMeeting.findByIdAndDelete(id);
        if (!meeting) return res.status(httpStatus.NOT_FOUND).send({ message: "Meeting not found" });
        res.status(httpStatus.OK).send({ message: "Meeting deleted permanently" });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};

export const startScheduledMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await ScheduledMeeting.findByIdAndUpdate(id, { status: 'Live' }, { new: true });
        if (!meeting) return res.status(httpStatus.NOT_FOUND).send({ message: "Meeting not found" });
        res.status(httpStatus.OK).send(meeting);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e.message });
    }
};
