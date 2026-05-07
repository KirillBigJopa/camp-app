import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatId: {
        type: String,
        ref: "Chat",
        required: true
    },
    sender: {
        type: String,
        enum: ["user", "admin", "bot"],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    buttons: [
        {
            text: String,
            value: String
        }
    ]
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);