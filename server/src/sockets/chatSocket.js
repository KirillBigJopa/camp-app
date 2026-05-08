import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { getBotResponse } from "../utils/botResponses.js";
const adminChats = new Map(); // socket.id -> chatId
const onlineUsers = new Map(); // userId -> socket.id
const adminSockets = new Set();
const initChatSocket = (io) => {

    io.on("connection", (socket) => {
        console.log("🔌 User connected:", socket.id);
        socket.on("get_online_users", () => {
            socket.emit("online_users_list", Array.from(onlineUsers.keys()));
        });
        // 🔹 регистрация пользователя
        socket.on("register", ({ userId }) => {
            console.log("REGISTER:", userId);

            onlineUsers.set(userId, socket.id);

            io.emit("online_users", onlineUsers.size);
        });

        socket.on("register_admin", () => {
            console.log("👨‍💼 ADMIN REGISTERED:", socket.id);

            adminSockets.add(socket.id);
        });

        // 🔹 вход в чат (user)
        socket.on("join_chat", (chatId) => {
            console.log("JOIN:", chatId);
            socket.join(chatId);
        });
        socket.on("call_user", ({ chatId, offer }) => {

            console.log("📞 CALL USER:", chatId);

            for (const adminId of adminSockets) {

                io.to(adminId).emit("incoming_call", {
                    offer,
                    chatId
                });

            }

        });

        // ответ на звонок
        socket.on("answer_call", ({ chatId, answer }) => {
            socket.to(chatId).emit("call_accepted", { answer });
        });

        // ICE кандидаты
        socket.on("ice_candidate", ({ chatId, candidate }) => {
            socket.to(chatId).emit("ice_candidate", { candidate });
        });
        // 🔹 админ входит в чат
        socket.on("admin_join_chat", async (chatId) => {
            console.log("ADMIN JOIN:", chatId);

            socket.join(chatId);
            adminChats.set(socket.id, chatId);

            const chat = await Chat.findById(chatId);
            chat.lastMessageAt = new Date();
            await chat.save();
            if (chat) {
                chat.status = "active";
                await chat.save();

                console.log("STATUS -> active");
            }
        });

        // 🔹 отправка сообщения
        socket.on("send_message", async (data) => {
            const { chatId, sender, text } = data;

            if (!chatId) {
                console.log("❌ chatId отсутствует");
                return;
            }
            console.log("SEND:", data);

            const message = await Message.create({
                chatId,
                sender,
                text
            });

            // отправка всем в комнате
            io.to(chatId).emit("receive_message", message);

            const chat = await Chat.findById(chatId);
            console.log("CHAT STATUS:", chat?.status);

            // 🤖 БОТ ЛОГИКА
            if (sender === "user" && chat.status === "bot") {

                // вызов админа
                if (text.toLowerCase().includes("админ")) {

                    chat.status = "waiting_admin";
                    await chat.save();

                    const botMsg = await Message.create({
                        chatId,
                        sender: "bot",
                        text: "Ожидайте, подключаем администратора..."
                    });

                    io.to(chatId).emit("receive_message", botMsg);

                    io.emit("admin_notification", { chatId, text });

                } else {
                    const botText = getBotResponse(text);

                    const botMsg = await Message.create({
                        chatId,
                        sender: "bot",
                        text: botText,
                        buttons: [
                            { text: "💰 Цена", value: "цена" },
                            { text: "📅 Длительность", value: "сколько дней" },
                            { text: "👶 Возраст", value: "возраст" },
                            { text: "🍽 Питание", value: "питание" },
                            { text: "📞 Админ", value: "админ" }
                        ]
                    });

                    io.to(chatId).emit("receive_message", botMsg);
                }
            }
            // пользователь инициирует звонок
            // 🔔 уведомления админу
            if (sender === "user" && chat.status !== "bot") {
                io.emit("admin_notification", { chatId, text });
            }
        });

        // 🔹 отключение
        socket.on("disconnect", async () => {
            console.log("❌ DISCONNECTED:", socket.id);

            // удалить из onlineUsers
            for (const [userId, sockId] of onlineUsers.entries()) {
                if (sockId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }

            io.emit("online_users", onlineUsers.size);

            // вернуть статус чата в bot если админ вышел
            const chatId = adminChats.get(socket.id);

            if (chatId) {
                const chat = await Chat.findById(chatId);

                if (chat) {
                    chat.status = "bot";
                    await chat.save();

                    console.log("STATUS -> bot");
                }

                adminChats.delete(socket.id);
            }
        });

    });
};

export default initChatSocket;