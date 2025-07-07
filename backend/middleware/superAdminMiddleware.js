const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireSuperAdmin = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return res.status(401).json({ error: 'Authorization token required' });

  const token = authorization.split(' ')[1];
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select('_id role');
    if (!user || user.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Access denied, super admin only' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireSuperAdmin;