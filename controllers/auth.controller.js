import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";


export const registerUser = async (req, res) => {

    const { name, email, password, phone, city, state, role } = req.body;
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 8;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    if (!validatePassword(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const allowedRoles = ["admin", "student"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            city,
            state,
            role
        });

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user)
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email or phone already exists" });
        }

        res.status(500).json({
            message: error.message
        });

    }
};

export const loginUser = async (req, res) => {

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user)
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const changePassword = async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    try {

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
        });
}
        const isMatch = await user.matchPassword(oldPassword);

        if (!isMatch) {
            return res.status(400).json({
                message: "Old password incorrect"
            });
        }

        user.password = newPassword;

        await user.save();

        res.status(200).json({
            message: "Password updated successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const forgotPassword = async (req, res) => {

    const { email } = req.body;

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            message: "Reset token generated",
            resetToken
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const resetPassword = async (req, res) => {

    const { token, newPassword } = req.body;

    try {

        const hashedToken = crypto
                            .createHash("sha256")
                            .update(token)
                            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        user.password = newPassword;

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};