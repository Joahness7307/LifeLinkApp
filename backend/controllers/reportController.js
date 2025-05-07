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
    const {
      emergencyId,
      userId,
      contactNumber,
      address,
      message,
      latitude,
      longitude,
      imageURL,
      cloudinaryPublicId,
    } = req.body;

    // Validate required fields
    if (!emergencyId || !userId || !contactNumber || !address) {
      console.error('Missing required fields:', { emergencyId, userId, contactNumber, address }); // Debug log
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the emergency type
    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency type not found' });
    }
    // console.log('Received emergencyId:', emergencyId);
    // console.log('Emergency found:', emergency);

    // Find the agency responsible for this emergency type
    const agency = await Agency.findOne({ categories: emergency.type });
    if (!agency) {
      return res.status(404).json({ error: 'No agency found for this category' });
    }
    // console.log('Agency found:', agency);
  
    let cloudinaryResult = null;
    if (req.file) {
      try {
        cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
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
          streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        });
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    const alert = new Alert({
      userId,
      agencyId: agency._id,
      emergencyId,
      category: emergency.type,
      contactNumber,
      location: address,
      message: message || 'No message provided',
      imageURL: imageURL || null, // Save the Cloudinary URL
      cloudinaryPublicId: cloudinaryPublicId || null, // Save the Cloudinary public ID
      latitude: latitude || null,
      longitude: longitude || null,
      status: 'pending',
    });

    await alert.save();

    agency.alerts.push(alert._id);
    await agency.save();

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

    responders.forEach((responder) => {
      sendNotification({
        responderId: responder._id,
        message: `🆕 New ${emergency.type} emergency reported by ${req.user.userName}.`,
        alertId: alert._id,
      });
    });

    res.status(201).json({
      message: 'Emergency report submitted successfully',
      alert,
      notifications,
    });
  } catch (error) {
    console.error('Error in submitReport:', error);
    res.status(500).json({
      error: 'Failed to submit report',
      details: error.message,
    });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (alert.cloudinaryPublicId) {
      try {
        const cloudinaryResult = await cloudinary.uploader.destroy(alert.cloudinaryPublicId);
        if (cloudinaryResult.result !== 'ok') {
          console.warn('Warning: Cloudinary image deletion was not successful.', cloudinaryResult);
        }
      } catch (cloudError) {
        console.error('Error deleting from Cloudinary:', cloudError);
      }
    }

    await Notification.deleteMany({ alertId });
    await Alert.findByIdAndDelete(alertId);

    res.status(200).json({ message: 'Alert and associated media deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAlert:', error);
    res.status(500).json({ error: 'Failed to delete alert and associated media' });
  }
};

module.exports = {
  submitReport,
  deleteAlert,
};
