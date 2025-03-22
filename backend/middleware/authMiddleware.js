const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    
    // Explicitly include role in the selection
    req.user = await User.findById(id).select('_id role');
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = { requireAuth };