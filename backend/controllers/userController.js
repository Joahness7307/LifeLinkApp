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
  const { userName, email, contactNumber, address } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { userName, email, contactNumber, address },
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

// complete profile
const completeProfile = async (req, res) => {
  try {
    const { contactNumber, address } = req.body;

    if (
      !contactNumber ||
      !address ||
      !address.country ||
      !address.region ||
      !address.province ||
      !address.city ||
      !address.cityCode || // Validate cityCode
      !address.barangay ||
      !address.barangayCode // Validate barangayCode
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { contactNumber, address, isProfileComplete: true },
      { new: true }
    );

    // Generate a new token with updated user data
    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        isProfileComplete: user.isProfileComplete,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({ ...user.toObject(), token }); // Return updated user data and token
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete profile' });
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
  completeProfile,
};
