const express = require('express');
const { createAgency, getAgencies, getAgencyById, updateAgencyCategories } = require('../controllers/agencyController');
const { requireAuth } = require('../middleware/authMiddleware');
// const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Protect the agency routes with the requireAuth and requireAdmin middleware
router.post('/create', requireAuth, createAgency);

// Update agency categories
router.patch('/update-categories', updateAgencyCategories);

// Get all agencies
router.get('/', getAgencies);

// Get single agency
router.get('/:id', getAgencyById);

module.exports = router;