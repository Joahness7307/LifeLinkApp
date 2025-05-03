const express = require('express');
const { getAlerts, updateAlertStatus } = require('../controllers/responderController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Only responders can access these routes
router.get('/alerts', requireAuth, requireRole('responder'), getAlerts);
router.put('/alerts/:alertId', requireAuth, requireRole('responder'), updateAlertStatus);

module.exports = router;
