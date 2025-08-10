import dotenv from 'dotenv';
dotenv.config();  // This should be at the VERY TOP before any other imports

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// Use the PORT from .env or default to 8080 (not 8000)
app.set("port", process.env.PORT || 8080);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGO_ATLAS);
        console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
        
        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${app.get("port")}`);  // Will show actual port being used
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);  // Exit if DB connection fails
    }
};

start();