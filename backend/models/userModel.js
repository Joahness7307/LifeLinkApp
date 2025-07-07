const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userName: { type: String, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    contactNumber: { type: String },
    address: {
      region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', default: undefined },
      province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: undefined },
      city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', default: undefined },
      cityCode: { type: String, default: '' },
      barangay: { type: String, default: '' },
      barangayCode: { type: String, default: '' },
    },
    role: {
      type: String,
      enum: ['superAdmin', 'regionAdmin', 'provinceAdmin', 'cityAdmin', 'departmentAdmin', 'responder', 'publicUser'],
      default: 'publicUser',
      required: true,
    },
    profilePicture: { type: String, default: '' },
    isProfileComplete: { type: Boolean, default: false },
    assignedArea: {
      region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
      province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
      city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
      barangay: { type: String },
      department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // For department admins
    isVerified: { type: Boolean, default: false }, // For email verification
    verificationToken: { type: String }, // Token for email verification
    invitationToken: { type: String }, // Token for email invitations
    invitationTokenExpires: { type: Date }, // Expiry date for invitation token
    fakeReportCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    fcmToken: { type: String, default: '' }, // For push notifications
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
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