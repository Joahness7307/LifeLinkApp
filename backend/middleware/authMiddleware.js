const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded Token:', jwt.verify(token, process.env.JWT_SECRET)); // Debug log

    const user = await User.findById(decoded.id).select('-password'); // Exclude password
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // console.log('Authenticated user:', user); // Debug log
    // Attach JWT payload fields to req.user
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // Ensure id is a string
      role: decoded.role,
      departmentId: decoded.departmentId, // <-- Attach from JWT!
      // add other fields from JWT if needed
    };
    console.log('User Role:', req.user.role);
    
    next();
  } catch (error) {
    console.error('Error in requireAuth middleware:', error); // Debug log
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = requireAuth;