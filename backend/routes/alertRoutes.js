const express = require('express');
const { createAlert, getAlertsByAgency, getAlertDetails } = require('../controllers/alertController');
const { deleteAlert } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect the alert routes with the requireAuth middleware
router.post('/create', requireAuth, createAlert);
router.get('/agency/:agencyId', requireAuth, getAlertsByAgency);
router.get('/:alertId', requireAuth, getAlertDetails);
router.delete('/:alertId', requireAuth, deleteAlert);

module.exports = router;