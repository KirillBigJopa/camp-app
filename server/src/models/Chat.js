import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ["bot", "waiting_admin", "active"],
        default: "bot"
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);