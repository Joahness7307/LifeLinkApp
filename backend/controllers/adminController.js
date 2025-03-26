const User = require('../models/userModel');
const Emergency = require('../models/emergencyModel');
const Agency = require('../models/agencyModel');
const Alert = require('../models/alertModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create another admin
const createAdmin = async (req, res) => {
  try {
    const { userName, email, password, phoneNumber, address } = req.body;

    if (!userName || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the admin already exists
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const adminUser = await User.create({
      userName,
      email: email.toLowerCase(), // Convert email to lowercase
      password,
      role: 'admin',
      phoneNumber: phoneNumber || 'N/A', // Default value if phoneNumber is missing
      address: address || 'N/A', // Default value if address is missing
    });

    // Generate a JWT Token
    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return the admin user data and token
      res.status(201).json({
      _id: adminUser._id,
      userName: adminUser.userName,
      email: adminUser.email,
      role: adminUser.role,
      phoneNumber: adminUser.phoneNumber,
      address: adminUser.address,
      token, // Include the token in the response
    });
  } catch (error) {
    console.error('Error creating admin:', error); // Log the error
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Add a user
const addUser = async (req, res) => {
  try {
    const { userName, email, password, role, phoneNumber, address, agencyId } = req.body;

    if (!userName || !email || !password || !phoneNumber || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      userName,
      email,
      password: hashedPassword,
      role,
      phoneNumber,
      address,
      ...(role === 'responder' && { agencyId }), // Include agencyId for responders
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add user' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all emergencies
const getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find();
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergencies' });
  }
};

// Add an emergency
const addEmergency = async (req, res) => {
  try {
    const { type, description, agency } = req.body;

    const newEmergency = await Emergency.create({ type, description, agency });
    res.status(201).json(newEmergency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add emergency' });
  }
};

// Update an emergency
const updateEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedEmergency = await Emergency.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedEmergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    res.status(200).json(updatedEmergency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update emergency' });
  }
};

// Delete an emergency
const deleteEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmergency = await Emergency.findByIdAndDelete(id);
    if (!deletedEmergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    res.status(200).json({ message: 'Emergency deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete emergency' });
  }
};

// Get all agencies
const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find();
    res.status(200).json(agencies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agencies' });
  }
};

// Add an agency
const addAgency = async (req, res) => {
  try {
    const { name, address, contactNumber, categories } = req.body;

    const newAgency = await Agency.create({ name, address, contactNumber, categories });
    res.status(201).json(newAgency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add agency' });
  }
};

// Update an agency
const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedAgency = await Agency.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedAgency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.status(200).json(updatedAgency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agency' });
  }
};

// Delete an agency
const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAgency = await Agency.findByIdAndDelete(id);
    if (!deletedAgency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.status(200).json({ message: 'Agency deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agency' });
  }
};

// Get all alerts
const getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Delete an alert
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the alert by ID
    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Remove the alert reference from the associated emergency
    if (alert.emergencyId) {
      await Emergency.findByIdAndUpdate(alert.emergencyId, {
        $pull: { alerts: id }, // Remove the alert ID from the emergency's alerts array
      });
    }

    // Remove the alert reference from the associated agency
    if (alert.agencyId) {
      await Agency.findByIdAndUpdate(alert.agencyId, {
        $pull: { alerts: id }, // Remove the alert ID from the agency's alerts array
      });
    }

    // Delete the alert
    await Alert.findByIdAndDelete(id);

    res.status(200).json({ message: 'Alert deleted successfully and references removed' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

module.exports = {
  createAdmin,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  getAllEmergencies,
  addEmergency,
  updateEmergency,
  deleteEmergency,
  getAllAgencies,
  addAgency,
  updateAgency,
  deleteAgency,
  getAllAlerts,
  deleteAlert,
};