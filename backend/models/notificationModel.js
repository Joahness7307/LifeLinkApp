const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For normal users
    responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For responders
    message: { type: String, required: true },
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);