import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import Chat from "../models/Chat.js";
import {
    createChat,
    getMessages,
    sendMessage,
    callAdmin
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/my", auth, async (req, res) => {
    let chat = await Chat.findOne({ userId: req.user._id });

    if (!chat) {
        chat = await Chat.create({
            userId: req.user._id,
            status: "bot"
        });
    }

    res.json(chat);
});
// создать чат
router.post("/", auth, createChat);
// получить все чаты
router.get("/", async (req, res) => {
    const chats = await Chat.find().populate("userId", "fullName email");

    const priority = {
        waiting_admin: 1,
        active: 2,
        bot: 3,
        closed: 4
    };

    chats.sort((a, b) => {
        // сначала по статусу
        if (priority[a.status] !== priority[b.status]) {
            return priority[a.status] - priority[b.status];
        }

        // потом по времени
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

    res.json(chats);
});

// получить сообщения
router.get("/:chatId", auth, getMessages);

// отправить сообщение
router.post("/:chatId/message", auth, sendMessage);

// вызвать админа
router.post("/:chatId/call-admin", auth, callAdmin);

export default router;