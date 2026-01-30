import { Router } from "express";
import {
    scheduleMeeting,
    getScheduledMeetings,
    updateScheduledMeeting,
    cancelMeeting,
    deleteMeeting,
    startScheduledMeeting
} from "../controllers/scheduledMeeting.controller.js";

const router = Router();

router.route("/schedule").post(scheduleMeeting);
router.route("/user").get(getScheduledMeetings);
router.route("/update/:id").put(updateScheduledMeeting);
router.route("/cancel/:id").patch(cancelMeeting);
router.route("/delete/:id").delete(deleteMeeting);
router.route("/start/:id").patch(startScheduledMeeting);

export default router;
