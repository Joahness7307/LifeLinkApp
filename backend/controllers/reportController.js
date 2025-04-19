const Alert = require('../models/alertModel');
const Emergency = require('../models/emergencyModel');
const Agency = require('../models/agencyModel');
const User = require('../models/userModel');
const multer = require('multer');
const { cloudinary, defaultDeliverySettings } = require('../config/cloudinary');
const { createAlertForAgency } = require('../utils/alertUtils');
const upload = require('../middleware/uploadMiddleware');
const Notification = require('../models/notificationModel');
const { sendNotification } = require('../utils/socketUtils');

const submitReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      } else if (err.message === 'Invalid file type. Only JPEG, PNG, and GIF are allowed.') {
        return res.status(400).json({ error: err.message });
      } else {
        return res.status(400).json({ error: 'File upload error.' });
      }
    }

    const { emergencyId, userId, message } = req.body;
    let imageURL = '';
    let cloudinaryPublicId = '';

    try {
      if (req.file) {
        // Add specific transformations and delivery settings
        const uploadOptions = {
          folder: 'emergency_reports',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          transformation: [{
            width: 'auto',
            crop: 'scale',
            quality: 'auto',
            fetch_format: 'auto',
            dpr: 'auto'
          }],
          ...defaultDeliverySettings,
          eager: [
            { width: 300, height: 300, crop: 'fill' },
            { width: 800, crop: 'scale' }
          ],
          eager_async: true,
          eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL
        };

        const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);

        console.log('Cloudinary upload result:', {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          size: result.bytes,
          resourceType: result.resource_type,
          eager: result.eager
        });

        imageURL = result.secure_url;
        cloudinaryPublicId = result.public_id;
      }

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
            category: emergency.type,
            contactNumber: user.phoneNumber,
            location: user.address,
            message,
            imageURL,
            cloudinaryPublicId, // Store the public_id for later deletion
            status: 'pending',
          })
        )
      );

      // Create notifications for responders
      const responders = await User.find({ 
        agencyId: { $in: agencies.map((a) => a._id) }, 
        role: 'responder' 
      });

      const notifications = await Promise.all(
        responders.map((responder) => {
          return Notification.create({
            responderId: responder._id,
            message: `🆕 New ${emergency.type} emergency reported by ${user.userName}.`,
            alertId: alerts[0]._id,
          });
        })
      );

      notifications.forEach((notification) => {
        sendNotification(notification);
      });

      res.status(201).json({ 
        message: 'Emergency report submitted successfully', 
        emergency, 
        alerts 
      });
    } catch (error) {
      console.error('Upload error details:', error);
      res.status(400).json({ 
        error: 'Failed to upload image', 
        details: error.message 
      });
    }
  });
};

// Add a function to delete alert and its associated media
const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Find the alert first to get the Cloudinary public_id
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // console.log('Alert found:', alert); // Debug log
    // console.log('Cloudinary public ID:', alert.cloudinaryPublicId); // Debug log

    // Check if there's an image to delete
    if (alert.imageURL && alert.cloudinaryPublicId) {
      try {
        // Delete the image from Cloudinary
        const cloudinaryResult = await cloudinary.uploader.destroy(alert.cloudinaryPublicId);
        // console.log('Cloudinary deletion result:', cloudinaryResult); // Debug log

        if (cloudinaryResult.result !== 'ok') {
          console.error('Failed to delete image from Cloudinary:', cloudinaryResult);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with alert deletion even if Cloudinary deletion fails
      }
    }

    // Delete associated notifications
    await Notification.deleteMany({ alertId });

    // Delete the alert
    await Alert.findByIdAndDelete(alertId);

    res.status(200).json({ message: 'Alert and associated media deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAlert:', error);
    res.status(500).json({ error: 'Failed to delete alert and associated media' });
  }
};

module.exports = {
  submitReport,
  deleteAlert
};