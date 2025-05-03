const express = require('express');
const { createAlert, getAlertsByAgency, getAlertDetails, respondToAlert } = require('../controllers/alertController');
const { deleteAlert } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Protect the alert routes with the requireAuth middleware
router.post('/create', requireAuth, requireRole('user'), createAlert);
router.get('/agency/:agencyId', requireAuth, getAlertsByAgency);
router.get('/:alertId', requireAuth, getAlertDetails);
router.patch('/:alertId/respond', requireAuth, requireRole('responder'), respondToAlert); // New route to respond to an alert
router.delete('/:alertId', requireAuth, requireRole(['responder', 'admin']), deleteAlert);

module.exports = router;