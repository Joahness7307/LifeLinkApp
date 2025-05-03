const express = require('express');
const { getNotifications, markNotificationAsRead, deleteNotification } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getNotifications); // Fetch notifications
router.patch('/:notificationId', requireAuth, markNotificationAsRead); // Mark notification as read
router.delete('/:notificationId', requireAuth, deleteNotification); // Delete notification

module.exports = router;