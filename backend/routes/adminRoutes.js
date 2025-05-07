const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const {
  createAdmin,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  getAllEmergencies,
  addEmergency,
  updateEmergency,
  deleteEmergency,
  getAllAgencies,
  addAgency,
  updateAgency,
  deleteAgency,
  getAllAlerts,
  deleteAlert,
} = require('../controllers/adminController');

const router = express.Router();

// Admin-only routes
router.post('/register', requireAuth, requireAdmin, createAdmin); // Create another admin
router.get('/users', requireAuth, requireAdmin, getAllUsers); // Get all users
router.post('/users', requireAuth, requireAdmin, addUser); // Add a user
router.patch('/users/:id', requireAuth, requireAdmin, updateUser); // Update a user
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser); // Delete a user

router.get('/emergencies', requireAuth, requireAdmin, getAllEmergencies); // Get all emergencies
router.post('/emergencies', requireAuth, requireAdmin, addEmergency); // Add an emergency
router.patch('/emergencies/:id', requireAuth, requireAdmin, updateEmergency); // Update an emergency
router.delete('/emergencies/:id', requireAuth, requireAdmin, deleteEmergency); // Delete an emergency

router.get('/agencies', requireAuth, requireAdmin, getAllAgencies); // Get all agencies
router.post('/agencies', requireAuth, requireAdmin, addAgency); // Add an agency
router.patch('/agencies/:id', requireAuth, requireAdmin, updateAgency); // Update an agency
router.delete('/agencies/:id', requireAuth, requireAdmin, deleteAgency); // Delete an agency

router.get('/alerts', requireAuth, requireAdmin, getAllAlerts); // Get all alerts
router.delete('/alerts/:id', requireAuth, requireAdmin, deleteAlert); // Delete an alert

// router.post('/create-first-admin', async (req, res) => {
//   const { userName, email, password, phoneNumber, address } = req.body;

//   if (!userName || !email || !password || !phoneNumber || !address) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   try {
//     const User = require('../models/userModel');

//     // Check if an admin already exists
//     const adminExists = await User.findOne({ role: 'admin' });
//     if (adminExists) {
//       return res.status(400).json({ error: 'An admin already exists' });
//     }

//     // Hash the password
//     // const hashedPassword = await bcrypt.hash(password, 10);

//     // Create the admin user
//     const adminUser = await User.create({
//       userName,
//       email: email.toLowerCase(),
//       password,
//       role: 'admin',
//       phoneNumber,
//       address,
//     });

//     res.status(201).json({
//       message: 'Admin created successfully',
//       admin: {
//         _id: adminUser._id,
//         userName: adminUser.userName,
//         email: adminUser.email,
//         role: adminUser.role,
//       },
//     });
//   } catch (error) {
//     console.error('Error creating admin:', error);
//     res.status(500).json({ error: 'Failed to create admin' });
//   }
// });

module.exports = router;