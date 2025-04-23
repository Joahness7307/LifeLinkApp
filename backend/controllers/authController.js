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
    const { userName, email, password, phoneNumber, address, role, agencyId, latitude, longitude } = req.body;

    console.log('Latitude:', latitude, 'Longitude:', longitude); // Debugging: Check if latitude and longitude are received

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
      latitude, // Save latitude
      longitude, // Save longitude
      ...(role === 'responder' && { agencyId }),
    });

    // Return response
    res.status(201).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      latitude: user.latitude, // Include latitude in response
      longitude: user.longitude, // Include longitude in response
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

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and explicitly select password, role, and agencyId
    const user = await User.findOne({ email }).select('+password +role +agencyId');

    if (!user) {
      // console.log('Login failed: User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // console.log("Stored hashed password:", user.password); // Log stored hash
    // console.log("Entered password:", password); // Log entered password

    // Compare provided password with stored hashed password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare response data
    const responseData = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      agencyId: user.agencyId || null,
      token,
    };

    // console.log('Login successful:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  registerUser,
  loginUser
};
