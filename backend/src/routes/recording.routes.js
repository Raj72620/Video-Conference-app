
import { Router } from "express";
import { uploadMiddleware, saveRecordingReference, getUserRecordings, deleteRecording } from "../controllers/recording.controller.js";

const router = Router();

router.post("/upload", uploadMiddleware, saveRecordingReference);
router.get("/user", getUserRecordings);
router.delete("/delete/:id", deleteRecording);

export default router;
