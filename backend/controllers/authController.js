const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Agency = require('../models/agencyModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { userName, email, password, phoneNumber, address, role, agencyId } = req.body;

    // Validate role
    if (!['user', 'responder'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Only "user" and "responder" roles are allowed.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // If role is responder, verify agency exists
    if (role === 'responder') {
      if (!agencyId) {
        return res.status(400).json({ error: 'Agency ID is required for responders' });
      }

      const agency = await Agency.findById(agencyId);
      if (!agency) {
        return res.status(400).json({ error: 'Invalid Agency ID' });
      }
    }

    // Create user
    const user = await User.create({
      userName,
      email,
      password,
      phoneNumber,
      address,
      role,
      ...(role === 'responder' && { agencyId }), // Save agencyId for responders
    });

    // Return response
    res.status(201).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      ...(user.role === 'responder' && { agencyId: user.agencyId }),
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select all fields including role and agencyId
    const user = await User.findOne({ email }).select('+password +role +agencyId');
    console.log('Login - Found user:', user); // Debug log

    if (user && (await user.matchPassword(password))) {
      const responseData = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        agencyId: user.agencyId || null, // Include agencyId for responders
        token: generateToken(user._id),
      };

      res.json(responseData);
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error); // Debug log
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser
};
