import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { Server } from "socket.io";
import initChatSocket from "./sockets/chatSocket.js";







dotenv.config();

await connectDB();

const server = http.createServer(app);

// 🔌 SOCKET.IO
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
});

// подключаем сокеты
initChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
console.log("MESSAGE ROUTES LOADED");