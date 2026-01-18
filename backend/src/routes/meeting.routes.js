import { Router } from "express";
import { startMeeting, validateMeeting, checkMeetingStatus } from "../controllers/meeting.controller.js";

const router = Router();

router.post("/start", startMeeting);
router.post("/validate", validateMeeting);
router.get("/status/:meetingCode", checkMeetingStatus);
router.post("/end", endMeeting);

export default router;
