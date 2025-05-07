const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Generate JWT token
const generateToken = (id, userName, contactNumber, address, isProfileComplete) => {
  return jwt.sign(
    { id, userName, contactNumber, address, isProfileComplete },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { userName, email, password, contactNumber, address } = req.body;

    // console.log('Registering user:', { email, password }); // Log the input data

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { userName }] });
    if (userExists) {
      return res.status(400).json({ error: 'Email or Username already exists' });
    }

    // Validate address
    if (
      !address ||
      !address.country ||
      !address.region ||
      !address.province ||
      !address.city ||
      !address.cityCode || // Validate cityCode
      !address.barangay ||
      !address.barangayCode // Validate barangayCode
    ) {
      return res.status(400).json({ error: 'Complete address is required' });
    }

  // Create user
    const user = await User.create({
      userName,
      email,
      password,
      contactNumber,
      address: {
        country: address.country,
        region: address.region,
        province: address.province,
        city: address.city,
        cityCode: address.cityCode, // Save cityCode
        barangay: address.barangay,
        barangayCode: address.barangayCode, // Save barangayCode
      },
      isProfileComplete: true, // Mark profile as complete
    });

    // console.log('User created:', user); // Log the created user object

    // Return response
    res.status(201).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      password: user.password,
      contactNumber: user.contactNumber,
      address: user.address,
      isProfileComplete: user.isProfileComplete,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error during registration:', error); // Log any errors
    res.status(400).json({ error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log('Login request received:', { email, password }); // Log the input data

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // console.log('User not found with email:', email); // Log if user is not found
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // console.log('User found:', user); // Log the found user object

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await user.matchPassword(password);
    // console.log('Password match:', isPasswordValid); // Log the result of password comparison

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = generateToken(user._id, user.userName, user.contactNumber, user.address, user.isProfileComplete);

    // console.log('Generated token payload:', {
    //   id: user._id,
    //   userName: user.userName,
    //   email: user.email,
    //   contactNumber: user.contactNumber,
    //   address: user.address,
    //   isProfileComplete: user.isProfileComplete,
    // });

    // Return user data and token
    res.status(200).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      contactNumber: user.contactNumber,
      address: user.address,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error); // Log any errors
    res.status(400).json({ error: error.message });
  }
};

// Google OAuth Login/Signup
const googleAuth = async (req, res) => {
  try {
    const { email, name } = req.user; // Extracted from Google profile
    let user = await User.findOne({ email });

    if (!user) {
      // Split the full name into firstName and lastName
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Create a new user if not found
      user = await User.create({
        userName: `${firstName} ${lastName}`,
        email,
        password: null, // No password for Google-authenticated users
        contactNumber: '', // Leave contactNumber empty for now
        isProfileComplete: false, // Mark as incomplete
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    res.status(200).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
      contactNumber: user.contactNumber,
      isProfileComplete: user.isProfileComplete, // Include this field
      token,
    });
  } catch (error) {
    console.error('Error during Google OAuth:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google. Please try again.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
};