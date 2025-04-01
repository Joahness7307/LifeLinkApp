const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// get user by id
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { userName, email, phoneNumber, address } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { userName, email, phoneNumber, address },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// verify email function
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.verifyEmail(userId);
    res.status(200).send('Email verified successfully!');
  } catch (err) {
    res.status(400).send('Invalid or expired token.');
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
};
