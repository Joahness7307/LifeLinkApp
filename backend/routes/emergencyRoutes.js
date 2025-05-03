const express = require('express');
const { getAllEmergencies, getEmergencyById, createEmergency, sendAlert } = require('../controllers/emergencyController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect the routes with the requireAuth middleware
router.get('/', requireAuth, getAllEmergencies);
router.get('/:id', requireAuth, getEmergencyById); // Add this line
router.post('/', requireAuth, createEmergency);
router.post('/alert', requireAuth, sendAlert);

module.exports = router;