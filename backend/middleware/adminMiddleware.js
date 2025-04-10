const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAdmin = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id }).select('_id role');

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
}; 

module.exports = requireAdmin;