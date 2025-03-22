const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '3d' });
}

// login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // create token
    const token = createToken(user._id);

    res.status(200).json({
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      _id: user._id,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// signup user
const signupUser = async (req, res) => {
  const { userName, email, password, phoneNumber, address } = req.body;

  try {
    const user = await User.signup(userName, email, password, phoneNumber, address);

    // create token
    const token = createToken(user._id);

    res.status(200).json({ userName, email, phoneNumber, address, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

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
}

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
}

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
}

// verify email function
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    const user = await User.verifyEmail(userId);  // Update user's verified status
    res.status(200).send('Email verified successfully!');
  } catch (err) {
    res.status(400).send('Invalid or expired token.');
  }
};

module.exports = {
  loginUser,
  signupUser,
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,  // Export the verifyEmail function
}