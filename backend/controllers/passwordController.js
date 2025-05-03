const User = require("../models/userModel");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Use app password
            },
        });

        const resetUrl = `http://localhost:3001/reset-password/${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Reset your password",
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
        });

        res.json({ message: "Password reset link sent to your email." });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    // console.log("New Password (Before Saving):", newPassword); // Log raw password

    // Assign new password directly (it will be hashed in pre-save)
    user.password = newPassword;

    // Save the updated user
    const updatedUser = await user.save();
    // console.log("Saved Hashed Password:", updatedUser.password); // Confirm save

    res.json({ message: "Password successfully reset." });
  } catch (error) {
    console.error("Reset Password Error:", error); // Log any errors
    res.status(400).json({ error: "Something went wrong." });
  }
};


