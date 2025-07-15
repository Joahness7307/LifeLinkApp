const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");

require("dotenv").config();

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate and assign token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Build reset URLs
    const webResetUrl = `${process.env.WEB_BASE_URL}/reset-password/${resetToken}`;
    const mobileResetUrl = `${process.env.MOBILE_BASE_URL}reset-password/${resetToken}`;

    // Prepare email content based on user role
    let html;
    if (user.role === 'publicUser') {
      html = `
        <p>Click the link below to reset your password in the mobile app:</p>
        <a href="${mobileResetUrl}">${mobileResetUrl}</a>
        <p>If the link is not clickable, copy and paste it into your browser or app.</p>
      `;
    } else {
      // For admin and all other roles
      html = `
        <p>Click the link below to reset your password (Web):</p>
        <a href="${webResetUrl}">${webResetUrl}</a>
        <p>If the link is not clickable, copy and paste it into your browser.</p>
      `;
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your LifeLink password",
      html,
    });

    res.json({ message: "Reset email sent. Please check your inbox." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
