const express = require('express');
const { createAgency, updateAgencyCategories } = require('../controllers/agencyController');
const requireAuth = require('../middleware/authMiddleware');
// const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Protect the agency routes with the requireAuth and requireAdmin middleware
router.post('/create', requireAuth, createAgency);

// Update agency categories
router.patch('/update-categories', updateAgencyCategories);

module.exports = router;