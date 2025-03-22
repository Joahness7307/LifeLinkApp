const express = require('express');
const { createAlert, getAlertsByAgency } = require('../controllers/alertController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// Protect the alert routes with the requireAuth middleware
router.post('/create', requireAuth, createAlert);
router.get('/agency/:agencyId', requireAuth, getAlertsByAgency);

module.exports = router;