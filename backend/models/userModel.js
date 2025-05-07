const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userName: { type: String, required: true, unique: true }, // Username
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false }, // Make password optional
    contactNumber: { type: String }, // Make contactNumber optional
    address: {
      country: { type: String },
      region: { type: String },
      province: { type: String },
      city: { type: String },
      cityCode: { type: String }, // Add cityCode
      barangay: { type: String },
      barangayCode: { type: String }, // Add barangayCode
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Default role is 'user'
      default: 'user',
      required: true,
    },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);