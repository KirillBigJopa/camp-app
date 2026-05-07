import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
const app = express();

// ===== MIDDLEWARE =====

// CORS
app.use(cors({
    origin: "*",
    credentials: true
}));

// Body parser (ДОЛЖЕН БЫТЬ ДО РОУТОВ)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(morgan("dev"));

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.status(200).json({
        message: "API работает",
        status: "OK"
    });
});

// ===== 404 =====
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

export default app;