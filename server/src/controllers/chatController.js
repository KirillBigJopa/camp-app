import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { getBotResponse } from "../utils/botResponses.js";

// создать чат
export const createChat = async (req, res) => {
    try {
        console.log("USER:", req.user);
        const userId = req.user._id;

        const chat = await Chat.create({ userId });

        const welcome = await Message.create({
            chatId: chat._id,
            sender: "bot",
            text: "Здравствуйте! Чем могу помочь?"
        });

        res.status(201).json({
            chat,
            firstMessage: welcome
        });

    } catch (e) {
        console.error("CREATE CHAT ERROR:", e);
        res.status(500).json({ message: e.message });
    }
};

// получить сообщения
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// отправить сообщение (пока без сокетов)
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text } = req.body;

        const userId = req.user._id;

        // сообщение пользователя
        const message = await Message.create({
            chatId,
            sender: "user",
            text
        });

        // ответ бота
        const botText = getBotResponse(text);

        let botMessage = null;

        if (botText) {
            botMessage = await Message.create({
                chatId,
                sender: "bot",
                text: botText
            });
        }

        res.json({
            userMessage: message,
            botMessage
        });

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// вызвать администратора
export const callAdmin = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findByIdAndUpdate(
            chatId,
            { status: "waiting_admin" },
            { new: true }
        );

        res.json(chat);

    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
