const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinary');

// get users profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('address.region', 'name')
      .populate('address.province', 'name')
      .populate('address.city', 'name');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get user by id
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
    .populate('address.region', 'name')
    .populate('address.province', 'name')
    .populate('address.city', 'name')
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'lifelink/profile_pictures', resource_type: 'image' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        // Update user profilePicture field
        const user = await User.findByIdAndUpdate(
          id,
          { profilePicture: result.secure_url },
          { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
      }
    );
    // Pipe the buffer to Cloudinary
    result.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

module.exports = {
  getUserProfile,
  getUserById,
  uploadProfilePicture,
  updateUser,
  deleteUser
};
