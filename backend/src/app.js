import dotenv from 'dotenv';
dotenv.config();  // This should be at the VERY TOP before any other imports

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// Use the PORT from .env or default to 8080
app.set("port", process.env.PORT || 8080);

app.use(cors({
    origin: [
        "https://videoconferenceapp123.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

import path from "path";
import { fileURLToPath } from 'url';
import recordingRoutes from "./routes/recording.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/recordings", recordingRoutes);

// Serve static files (uploads)
// 'backend/public/uploads' mapped to '/uploads'
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

const start = async () => {
    try {
        console.log("Connecting to MongoDB...");

        // Get the connection string from environment
        const mongoUrl = process.env.MONGO_ATLAS;

        console.log("MongoDB Connection URL:", mongoUrl);

        // Connect to MongoDB with the vidtalk database
        const connectionDb = await mongoose.connect(mongoUrl, {
            // Remove dbName if database is specified in connection string
            // If database name is in connection string, mongoose will use it automatically
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✅ MONGO Connected to Cluster: ${connectionDb.connection.host}`);
        console.log(`✅ MONGO Connected to Database: ${connectionDb.connection.name}`);

        // Add connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('✅ Mongoose connected to:', mongoose.connection.db.databaseName);
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ Mongoose disconnected');
        });

        server.listen(app.get("port"), () => {
            console.log(`🚀 Server listening on port ${app.get("port")}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        process.exit(1);  // Exit if DB connection fails
    }
};

start();