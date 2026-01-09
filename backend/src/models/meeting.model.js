import mongoose, { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        user_id: { type: String },
        host_id: { type: String },
        meetingCode: { type: String, required: true },
        password: { type: String }, // Optional password
        isEnded: { type: Boolean, default: false },
        date: { type: Date, default: Date.now, required: true },
        startTime: { type: Date, default: Date.now },
        endTime: { type: Date }
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };
