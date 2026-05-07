import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const register = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // Проверка
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ message: "Заполните все поля" });
        }

        // Уже существует?
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Email уже используется" });
        }

        // Хеш пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создание пользователя
        const user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword
        });

        res.status(201).json({
            token: generateToken(user),
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Неверный пароль" });
        }

        res.json({
            token: generateToken(user),
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMe = async (req, res) => {
    res.json(req.user);
};