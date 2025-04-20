const Alert = require('../models/alertModel');
const Emergency = require('../models/emergencyModel');
const Agency = require('../models/agencyModel');
const User = require('../models/userModel');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { createAlertForAgency } = require('../utils/alertUtils');
const upload = require('../middleware/uploadMiddleware');
const Notification = require('../models/notificationModel');
const { sendNotification } = require('../utils/socketUtils');
const streamifier = require('streamifier');

const submitReport = async (req, res) => {
  try {
    const { emergencyId, userId, contactNumber, address, message } = req.body;

    // Debug logs to verify received data
    console.log('Received report submission:', {
      emergencyId,
      userId,
      contactNumber,
      address,
      message,
      file: req.file,
    });

    // Validate required fields
    if (!contactNumber || !address) {
      return res.status(400).json({ error: 'Contact number and address are required.' });
    }

    // Find the emergency to get its category
    console.log('Searching for emergencyId:', emergencyId);
    const emergency = await Emergency.findById(emergencyId);
    console.log('Emergency found:', emergency);

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency type not found' });
    }

    // Find an agency that matches the emergency category
    const agency = await Agency.findOne({ categories: emergency.type });
    if (!agency) {
      return res.status(404).json({ error: 'No agency found for this category' });
    }

    // Handle file upload to Cloudinary
    let cloudinaryResult = null;
    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary...');
        const uploadPromise = new Promise((resolve, reject) => {
          const cloudinaryStream = cloudinary.uploader.upload_stream(
            {
              folder: 'reports',
              resource_type: 'auto',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(cloudinaryStream);
        });

        cloudinaryResult = await uploadPromise;
        console.log('Cloudinary upload result:', cloudinaryResult);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    // Create alert (report)
    const alert = new Alert({
      userId,
      agencyId: agency._id,
      emergencyId,
      category: emergency.type,
      contactNumber,
      location: address,
      message: message || 'No message provided', // Default value if not provided
      imageURL: cloudinaryResult?.secure_url || null, // Null if no image is uploaded
      cloudinaryPublicId: cloudinaryResult?.public_id || null,
      status: 'pending',
    });

    await alert.save();

    // Add the alert to the agency's alerts array
    agency.alerts.push(alert._id);
    await agency.save();

    // Notify responders in the agency
    const responders = await User.find({ agencyId: agency._id, role: 'responder' });
    const notifications = await Promise.all(
      responders.map((responder) =>
        Notification.create({
          responderId: responder._id,
          message: `🆕 New ${emergency.type} emergency reported by ${req.user.userName}.`,
          alertId: alert._id,
          isRead: false,
        })
      )
    );

    // Emit notifications to responders
    responders.forEach((responder) => {
      sendNotification({
        responderId: responder._id,
        message: `🆕 New ${emergency.type} emergency reported by ${req.user.userName}.`,
        alertId: alert._id,
      });
    });

    res.status(201).json({ message: 'Emergency report submitted successfully', alert, notifications });
  } catch (error) {
    console.error('Error in submitReport:', error);
    res.status(400).json({
      error: 'Failed to submit report',
      details: error.message,
    });
  }
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