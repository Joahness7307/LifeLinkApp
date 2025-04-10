const Alert = require('../models/alertModel');
const Emergency = require('../models/emergencyModel');
const Agency = require('../models/agencyModel');
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');
const { createAlertForAgency } = require('../utils/alertUtils');
const upload = require('../middleware/uploadMiddleware');
const Notification = require('../models/notificationModel');
const { sendNotification } = require('../utils/socketUtils'); // Import sendNotification

const submitReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      } else if (err.message === 'Invalid file type. Only JPEG, PNG, and GIF are allowed.') {
        return res.status(400).json({ error: err.message });
      } else {
      return res.status(400).json({ error: 'File upload error.' });
    }
  }

    const { emergencyId, userId, message } = req.body;
    const imageURL = req.file ? `/uploads/${req.file.filename}` : ''; // Get the file path if exists

    try {
      // Check if emergencyId is provided
      if (!emergencyId) {
        return res.status(400).json({ error: 'Emergency ID is required' });
      }

      // Find the existing emergency record
      const emergency = await Emergency.findById(emergencyId);
      if (!emergency) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Find agencies associated with the emergency type
      const agencies = await Agency.find({ categories: emergency.type });
      if (agencies.length === 0) {
        return res.status(404).json({ error: 'No agencies found for this emergency type' });
      }

      // Create an alert for each agency using utility function
      const alerts = await Promise.all(
        agencies.map((agency) =>
          createAlertForAgency({
            userId: user._id,
            agencyId: agency._id,
            category: emergency.type, // Set the category to the emergency type (e.g., "MEDICAL")
            contactNumber: user.phoneNumber,
            location: user.address,
            message,
            imageURL,
            status: 'pending',
          })
        )
      );

      console.log('Alerts created:', alerts); // Debug log

      // Create notifications for responders in the associated agencies
      const responders = await User.find({ agencyId: { $in: agencies.map((a) => a._id) }, role: 'responder' });
      console.log('Responders found:', responders); // Debug log

      const notifications = await Promise.all(
        responders.map((responder) => {
          if (!responder._id) {
            console.error('Responder ID is undefined:', responder); // Debug log
          }
          return Notification.create({
            responderId: responder._id,
            message: `🆕 New ${emergency.type} emergency reported by ${user.userName}.`, // Include category and username
            alertId: alerts[0]._id, // Associate the first alert (or modify as needed)
          });
        })
      );

      console.log('Notifications created:', notifications); // Debug log

      // Emit the new notifications to all connected clients
      notifications.forEach((notification) => {
        console.log('Emitting notification:', notification); // Debug log
        sendNotification(notification); // Emit the notification
      });

      res.status(201).json({ message: 'Emergency report submitted successfully', emergency, alerts });
    } catch (error) {
      console.error('Error submitting report:', error);
      res.status(400).json({ error: error.message });
    }
  });
};

module.exports = {
  submitReport,
};