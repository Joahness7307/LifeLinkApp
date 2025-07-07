const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id, userName, isProfileComplete, role, departmentId, contactNumber, address) => {
  return jwt.sign(
    { id, userName, isProfileComplete, role, departmentId, contactNumber, address },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { userName, email, password, role, contactNumber } = req.body;

    // console.log('Registering user:', { email, password }); // Log the input data

    if (!userName || userName.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (!contactNumber || !/^09\d{9}$|^0\d{9,10}$/.test(contactNumber)) {
      return res.status(400).json({ error: 'Invalid Philippine contact number.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { userName }] });
    if (userExists) {
      return res.status(400).json({ error: 'Email or Username already exists' });
    }

  // Genereate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create user (immediately verified)
    const user = await User.create({
      userName,
      email,
      password,
      contactNumber,
      role: role || 'publicUser', // Default to 'publicUser' if no role is provided
      isProfileComplete: role === 'publicUser' ? true : undefined, // Only set isProfileComplete for public users
      isVerified: true, // <-- Set verified immediately
      // verificationToken, // Store the verification token
    });

    // Send verification email
    // const transporter = nodemailer.createTransport({
    //   service: 'Gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

     // Generate a JWT token
     const token = generateToken(
      user._id,
      user.userName,
      user.isProfileComplete,
      user.contactNumber,
      user.address,
      user.role,
      user.departmentId || null // Include departmentId if it exists
    );

    // const verifyUrl = `lifelinkapp-mobile://email-verified?token=${verificationToken}`;
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'Verify your LifeLink account',
    //   html: `<p>Hi ${userName},</p>
    //          <p>Click the link below to verify your account:</p>
    //          <a href="${verifyUrl}">${verifyUrl}</a>`,
    // };

    // await transporter.sendMail(mailOptions);

    // Return response
    res.status(201).json({
      message: 'Registration successful! You can now login.',
    });
  } catch (error) {
    console.error('Error during registration:', error); // Log any errors
    res.status(400).json({ error: error.message });
  }
};

// Verify email
// const verifyEmail = async (req, res) => {
//   const { token } = req.query;
//   try {
//     const user = await User.findOne({ verificationToken: token });
//     if (!user) {
//       return res.status(400).send('Invalid or expired verification token.');
//     }
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save();
//     res.status(200).send('Email verified successfully! You can go back to the app and login.');
//   } catch (err) {
//     res.status(400).send('Invalid or expired token.');
//   }
// };

// Resend verification email
// const resendVerificationEmail = async (req, res) => {
//   const { email } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ error: 'User not found.' });
//     if (user.isVerified) return res.status(400).json({ error: 'User already verified.' });

//     const verificationToken = crypto.randomBytes(32).toString('hex');
//     user.verificationToken = verificationToken;
//     await user.save();

//     const transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//     const verifyUrl = `lifelinkapp-mobile://email-verified?token=${verificationToken}`;
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Verify your LifeLink account',
//       html: `<p>Click the link below to verify your account:</p>
//              <a href="${verifyUrl}">${verifyUrl}</a>`,
//     };
//     await transporter.sendMail(mailOptions);

//     res.json({ message: 'Verification email resent. Please check your inbox.' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to resend verification email.' });
//   }
// };

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log('Login request received:', { email, password }); // Log the input data

    // In authController.js, inside loginUser
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password').populate('assignedArea.department');
    if (!user) {
      // console.log('User not found with email:', email); // Log if user is not found
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // console.log('User found:', user); // Log the found user object

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await user.matchPassword(password);
    // console.log('Hashed password from DB:', user.password);
    // console.log('Plain password:', password);
    //  console.log('Password match:', isPasswordValid); // Log the result of password comparison

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // if (!user.isVerified) {
    //   return res.status(401).json({ error: 'Please verify your email before logging in.' });
    // }

    // Generate a JWT token
    const token = generateToken(
      user._id,
      user.userName,
      user.isProfileComplete, 
      user.role,
      user.departmentId?.toString() || (user.assignedArea?.department?._id?.toString()) || null,
      user.contactNumber, 
      user.address
    );

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
      role: user.role,
      departmentId: user.departmentId?.toString() || (user.assignedArea?.department?._id?.toString()) || null,
      isProfileComplete: user.isProfileComplete,
      contactNumber: user.contactNumber,
      address: user.address,
      assignedArea: user.assignedArea,
      isBlocked: user.isBlocked,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error); // Log any errors
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  // verifyEmail,
  // resendVerificationEmail,
  loginUser
};