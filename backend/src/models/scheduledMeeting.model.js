import mongoose from "mongoose";
const Schema = mongoose.Schema;

const scheduledMeetingSchema = new Schema({
    meetingCode: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // format "HH:mm"
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Live', 'Ended', 'Cancelled'],
        default: 'Scheduled'
    },
    description: {
        type: String
    }
}, { timestamps: true });

const ScheduledMeeting = mongoose.model("ScheduledMeeting", scheduledMeetingSchema);

export { ScheduledMeeting };
