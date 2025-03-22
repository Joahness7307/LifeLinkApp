const mongoose = require('mongoose');
const Emergency = require('../models/emergencyModel');
const Alert = require('../models/alertModel');

const getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find().populate('agency', 'name contactNumber');
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getEmergencyById = async (req, res) => {
  const { id } = req.params;

  // Check if the provided ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid emergency ID' });
  }

  try {
    const emergency = await Emergency.findById(id).populate('agency', 'name contactNumber');
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    res.status(200).json(emergency);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createEmergency = async (req, res) => {
  const { type, description, agency } = req.body;

  try {
    const emergency = await Emergency.create({ type, description, agency });
    res.status(201).json(emergency);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendAlert = async (req, res) => {
  const { userId, emergencyId, agencyId, location, message, imageURL } = req.body;

  try {
    const alert = await Alert.create({ userId, emergencyId, agencyId, location, message, imageURL });
    res.status(200).json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllEmergencies,
  getEmergencyById,
  createEmergency,
  sendAlert
};