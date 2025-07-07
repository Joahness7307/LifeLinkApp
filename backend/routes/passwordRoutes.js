const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3001'; // Set this in your .env for production
const MOBILE_BASE_URL = process.env.MOBILE_BASE_URL || 'lifelinkapp-mobile://';

// POST /api/password/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Web link for admins
  const webResetUrl = `${WEB_BASE_URL}/reset-password/${resetToken}`;

  // Mobile link
  const mobileResetUrl = `${MOBILE_BASE_URL}reset-password/${resetToken}`;

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your LifeLink password',
    html: `<p>Click the link below to reset your password (Web):</p>
          <a href="${webResetUrl}">${webResetUrl}</a>
          <br/><br/>
          <b>For mobile app users:</b>
          <br/>
          <a href="${mobileResetUrl}">${mobileResetUrl}</a>
          <p>If the link is not clickable, copy and paste it into your browser or app.</p>`,
  });

  res.json({ message: 'Reset email sent. Please check your inbox.' });
});

// POST /api/password/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
});

module.exports = router;