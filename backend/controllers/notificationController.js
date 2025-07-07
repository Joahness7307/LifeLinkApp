const Notification = require('../models/notificationModel');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    let notifications;

    if (req.user.role === 'responder') {
      // Fetch notifications for responders
      notifications = await Notification.find({ responderId: userId })
        .sort({ createdAt: -1 })
        .populate({
          path: 'alertId',
          select: 'category userId status',
          populate: { path: 'userId', select: 'userName' },
        });
    } else if (req.user.role === 'user') {
      // Fetch notifications for normal users (only "responding" alerts for their reports)
      notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .populate({
          path: 'alertId',
          match: { status: 'responding', userId }, // Only include alerts with status "responding" and matching userId
          select: 'category status',
        })
        .lean();

      // Filter out notifications where the alertId is null (due to the match filter)
      notifications = notifications.filter((notif) => notif.alertId !== null);
    }

    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a notification by ID
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Find and delete the notification
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  deleteNotification, // Export the new function
};