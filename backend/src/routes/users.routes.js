import { Router } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { addToHistory, getUserHistory, login, register, deleteHistory } from "../controllers/user.controller.js";



const router = Router();

console.log("Using user routes..."); // Debug log

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

router.route("/delete_meeting/:meetingId").delete(deleteHistory)


export default router;