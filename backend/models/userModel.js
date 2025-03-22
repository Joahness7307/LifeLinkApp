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
    required: true
  },
  phoneNumber: { 
    type: String,   
    required: false 
  },
  address: { 
    type: String, 
    required: false 
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema); // Create the model FIRST

// Define the static signup method on the model
User.signup = async function (userName, email, password, phoneNumber, address) {
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await this.create({ userName, email, password: hashedPassword, phoneNumber, address });
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