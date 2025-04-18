const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { 
    type: String, 
    required: true,
    unique: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false // Don't include password by default
  },
  phoneNumber: { 
    type: String,   
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['user', 'responder', 'admin'],
    default: 'user',
    required: true // Make sure role is required
  },
  // For responders only
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    // Only required if role is responder
    required: function() {
      return this.role === 'responder';
    }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema); // Create the model FIRST

// Define the static signup method on the model
User.signup = async function (userName, email, password, phoneNumber, address, role = 'user', agencyId = null) {
  // validation
  if (!userName || !email || !password || !phoneNumber || !address) {
    throw new Error('All fields are required');
  }
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email');
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error('Password must have an uppercase letter, number, and special character');
  }

  const emailExists = await this.findOne({ email });

  if (emailExists) {
    throw new Error('Email already in use');
  }

  // Validate role
  if (!['user', 'responder', 'admin'].includes(role)) {
    throw new Error('Invalid role');
  }

  // Check if agencyId is provided for responder role
  if (role === 'responder' && !agencyId) {
    throw new Error('Agency ID is required for responders');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await this.create({ 
    userName, 
    email, 
    password: hashedPassword, 
    phoneNumber, 
    address,
    role,
    ...(role === 'responder' && { agencyId })
  });
  
  return user;
};

// Define the static login method on the model
User.login = async function (email, password) {
  // validation
  if (!email || !password) {
    throw new Error('All fields are required');
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw new Error('Email is not registered');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Invalid password');
  }

  return user;
}

// Method to update verification status
User.verifyEmail = async function (userId) {
  const user = await this.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.verified = true;
  await user.save();
  return user;
};

module.exports = User; // Export the model, not the schema