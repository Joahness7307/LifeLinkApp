const express = require('express');
const mongoose = require('mongoose');
const Department = require('../models/departmentModel');
const { getAllEmergencyTypesWithDepartments, getDepartmentIdForType } = require('../controllers/departmentController');
const router = express.Router();

router.get('/emergency-types', getAllEmergencyTypesWithDepartments);
router.get('/for-type/:type', getDepartmentIdForType);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;
    if (req.query.province) filter.province = req.query.province;
    if (req.query.region) filter.region = req.query.region;
    console.log('Department filter:', filter);
    const departments = await Department.find(filter);
    console.log('Departments found:', departments.length);
    res.json(departments);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Add this route for department search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const city = req.query.city; // <-- get city from query
    const regex = new RegExp(q, 'i');
    const filter = {
      $or: [
        { name: regex },
        { address: regex },
        { emergencyTypes: { $in: [regex] } },
        { mobileNumbers: { $in: [regex] } },
        { landlineNumbers: { $in: [regex] } }
      ]
    };
    if (city) {
      // Convert city to ObjectId if it's a valid id
      if (mongoose.Types.ObjectId.isValid(city)) {
        filter.city = new mongoose.Types.ObjectId(city);
      } else {
        return res.status(400).json({ error: 'Invalid city id' });
      }
    }
    console.log('Department search filter:', filter);
    const departments = await Department.find(filter);
    res.json(departments);
  } catch (e) {
    console.error('Department search error:', e);
    res.status(500).json({ error: 'Failed to search departments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

module.exports = router;