import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { auth } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
const router = express.Router();

// регистрация
router.post("/register", async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        console.log("BODY:", req.body);

        const user = await User.create({
            fullName,
            email,
            phone,
            password
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            "secret123",
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(400).json({ error: "Неверные данные" });
        }

        // 🔥 создаём токен
        const token = jwt.sign(
            { id: user._id, role: user.role },
            "secret123", // потом вынесем в .env
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/me", auth, getMe);

export default router;