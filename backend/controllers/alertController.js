const Alert = require('../models/alertModel');
const Agency = require('../models/agencyModel');
const Emergency = require('../models/emergencyModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { createAlertForAgency } = require('../utils/alertUtils');
const { sendNotification } = require('../utils/socketUtils'); // Import socket notification utility

const createAlert = async (req, res) => {
  const { category, contactNumber, location, message, imageURL } = req.body;

  try {
    // Find an agency that matches the alert category
    const agency = await Agency.findOne({ categories: category });

    if (!agency) {
      return res.status(404).json({ error: 'No agency found for this category' });
    }

    // Normalize category to match Emergency type (case-insensitive)
    console.log('Category:', category.toUpperCase());
    const emergency = await Emergency.findOne({ type: category.toUpperCase() });
    console.log('Emergency Query Result:', emergency);

    if (!emergency) {
      return res.status(404).json({ error: 'No emergency type found for this category' });
    }

    console.log('Fetched Emergency:', emergency); // Debug log

    const alert = await createAlertForAgency({
      userId: req.user._id,
      agencyId: agency._id,
      emergencyId: emergency._id,
      emergencyType: emergency.type,
      emergencyDescription: emergency.description,
      category,
      contactNumber,
      location,
      message,
      imageURL,
    });

    // Add the alert to the agency's alerts array
    agency.alerts.push(alert._id);
    await agency.save();

    res.status(201).json(alert);
  } catch (error) {
    console.log("Error creating alert: ", error);
    res.status(400).json({ error: error.message });
  }
};

const getAlertsByAgency = async (req, res) => {
  const { agencyId } = req.params;

  try {
    const alerts = await Alert.find({ agencyId }).populate('userId', 'userName phoneNumber address');
    res.status(200).json(alerts);
  } catch (error) {
    console.log("Error fetching alerts: ", error);
    res.status(400).json({ error: error.message });
  }
};

const getAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Find the alert by its ID and populate related fields
    const alert = await Alert.findById(alertId)
      .populate('userId', 'userName phoneNumber address') // Populate user details
      .populate('agencyId', 'name') // Populate agency details
      .populate('emergencyId', 'type description'); // Populate emergency details

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    console.log('Fetched Alert:', alert); // Debug log

    res.status(200).json(alert);
  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(400).json({ error: error.message });
  }
};

const respondToAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Find the alert
    const alert = await Alert.findById(alertId).populate('userId');
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update the alert status to "responding"
    alert.status = 'responding';
    await alert.save();

    // Notify the user who submitted the report
    const notificationMessage = `🆕 Your ${alert.category} report is now being responded to.`;
    const notification = await Notification.create({
      userId: alert.userId._id, // Notify the normal user
      message: notificationMessage,
      alertId: alert._id,
      isRead: false, // Mark it as unread for the normal user
    });

    console.log('Notification created for normal user:', notification);

    // Emit the notification to the user
    sendNotification({
      userId: alert.userId._id,
      message: notificationMessage,
      alertId: alert._id,
    });

    res.status(200).json({ message: 'Alert status updated to responding', alert });
  } catch (error) {
    console.error('Error responding to alert:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createAlert,
  getAlertsByAgency,
  getAlertDetails, // Export the new function
  respondToAlert,
};