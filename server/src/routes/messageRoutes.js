import express from "express";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import { auth } from "../middleware/authMiddleware.js";
import Chat from "../models/Chat.js";

const router = express.Router();

router.get("/:chatId", auth, async (req, res) => {
    try {
        const { chatId } = req.params;

        // 🔥 проверяем чат
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: "Чат не найден" });
        }

        // 🔥 если не админ и не владелец
        if (
            chat.userId.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ error: "Нет доступа" });
        }

        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
console.log("MESSAGE ROUTE HIT");
export default router;