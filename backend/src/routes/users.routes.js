import { Router } from "express";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { addToHistory, getUserHistory, login, register,deleteHistory } from "../controllers/user.controller.js";



const router = Router();

router.route("/login").post(login)
router.post('/register', async (req, res) => {
    console.log("Registration request body:", req.body); // Debug log
    
    const { name, username, password } = req.body;
    
    if (!name || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        console.log("Checking for existing user...");
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating new user...");
        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();
        console.log("User saved to DB:", newUser);

        return res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username
            }
        });

    } catch (e) {
        console.error("Registration error:", e);
        return res.status(500).json({ 
            message: "Registration failed",
            error: e.message 
        });
    }
});
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

router.route("/delete_meeting/:meetingId").delete(deleteHistory)


export default router;