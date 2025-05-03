const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
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
router.post('/register', requireAuth, requireRole('admin'), createAdmin); // Create another admin
router.get('/users', requireAuth, requireRole('admin'), getAllUsers); // Get all users
router.post('/users', requireAuth, requireRole('admin'), addUser); // Add a user
router.patch('/users/:id', requireAuth, requireRole('admin'), updateUser); // Update a user
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser); // Delete a user

router.get('/emergencies', requireAuth, requireRole('admin'), getAllEmergencies); // Get all emergencies
router.post('/emergencies', requireAuth, requireRole('admin'), addEmergency); // Add an emergency
router.patch('/emergencies/:id', requireAuth, requireRole('admin'), updateEmergency); // Update an emergency
router.delete('/emergencies/:id', requireAuth, requireRole('admin'), deleteEmergency); // Delete an emergency

router.get('/agencies', requireAuth, requireRole('admin'), getAllAgencies); // Get all agencies
router.post('/agencies', requireAuth, requireRole('admin'), addAgency); // Add an agency
router.patch('/agencies/:id', requireAuth, requireRole('admin'), updateAgency); // Update an agency
router.delete('/agencies/:id', requireAuth, requireRole('admin'), deleteAgency); // Delete an agency

router.get('/alerts', requireAuth, requireRole('admin'), getAllAlerts); // Get all alerts
router.delete('/alerts/:id', requireAuth, requireRole('admin'), deleteAlert); // Delete an alert

module.exports = router;