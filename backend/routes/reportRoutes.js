const express = require('express');

const { submitReport } = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Only normal users can submit reports
router.post('/', requireAuth, requireRole('user'), submitReport);

module.exports = router;