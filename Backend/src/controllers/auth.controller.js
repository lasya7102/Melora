const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Register User
async function registerUser(req, res) {
    try {
        const { username, email, password, role = "user" } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required"
            });
        }

        const userAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (userAlreadyExists) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
            role
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET
        );

        res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none"
});

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Login User
async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if ((!username && !email) || !password) {
            return res.status(400).json({
                message: "Username or email and password are required"
            });
        }

        const user = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET
        );

        res.cookie("token", token);

        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

// Logout User
async function logout(req, res) {
    try {
        res.clearCookie("token");

        return res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

async function updateUsername(req, res) {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        const existingUser = await userModel.findOne({ username });

        if (existingUser && existingUser._id.toString() !== req.user.id) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { username },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "Username updated successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

async function ChangePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Old password and new password are required"
            });
        }

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Old password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            message: "Password updated successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

async function DeleteAccount(req, res) {
    try {
        const user = await userModel.findByIdAndDelete(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.clearCookie("token");

        return res.status(200).json({
            message: "Account deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logout,
    updateUsername,
    ChangePassword,
    DeleteAccount
};
