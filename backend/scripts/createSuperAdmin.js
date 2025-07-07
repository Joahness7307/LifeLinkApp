require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

async function createSuperAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: 'superadmin@example.com' });
  if (existing) {
    console.log('Super Admin already exists!');
    process.exit(0);
  }

  await User.create({
    userName: 'SuperAdmin',
    email: 'superadmin@example.com',
    password: 'passSA@123',
    role: 'superAdmin',
    contactNumber: '09562287307',
    isProfileComplete: true,
    isVerified: true,
  });

  console.log('Region Admin created!');
  process.exit();
}

createSuperAdmin();