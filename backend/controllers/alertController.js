const Alert = require('../models/alertModel');
const Agency = require('../models/agencyModel');

const createAlert = async (req, res) => {
  const { category, contactNumber, location, message, imageURL } = req.body;

  try {
    // Find an agency that matches the alert category
    const agency = await Agency.findOne({ categories: category });

    if (!agency) {
      return res.status(404).json({ error: 'No agency found for this category' });
    }

    const alert = await Alert.create({
      userId: req.user._id,
      agencyId: agency._id,
      category,
      contactNumber,
      location,
      message,
      imageURL
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
    const alerts = await Alert.find({ agencyId }).populate('userId', 'firstName lastName email');
    res.status(200).json(alerts);
  } catch (error) {
    console.log("Error fetching alerts: ", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createAlert,
  getAlertsByAgency
};