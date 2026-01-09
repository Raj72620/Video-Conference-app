
import mongoose, { Schema } from "mongoose";

const recordingSchema = new Schema(
    {
        host_id: { type: String, required: true },
        meetingCode: { type: String, required: true },
        videoUrl: { type: String, required: true }, // Path to the file
        date: { type: Date, default: Date.now },
        duration: { type: String }, // Optional: duration string
        size: { type: Number } // Size in bytes
    }
);

const Recording = mongoose.model("Recording", recordingSchema);

export { Recording };
