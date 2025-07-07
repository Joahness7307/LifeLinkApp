const express = require('express');
const Region = require('../models/regionModel');
const Province = require('../models/provinceModel');
const City = require('../models/cityModel');
const Barangay = require('../models/barangayModel');
const router = express.Router();

// Get all regions
router.get('/regions', async (req, res) => {
  try {
    const regions = await Region.find();
    res.json(regions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await Province.find();
    res.json(provinces);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/provinces/:regionId', async (req, res) => {
  const provinces = await Province.find({ region: req.params.regionId }).select('_id name code');
  res.json(provinces);
});

router.get('/cities/:provinceId', async (req, res) => {
  const cities = await City.find({ province: req.params.provinceId }).select('_id name code');
  res.json(cities);
});

router.get('/cities', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'City name is required' });
  // Use regex for partial, case-insensitive match
  const cities = await City.find({ name: new RegExp(name, 'i') });
  res.json(cities);
});

// Get barangays by city
router.get('/barangays/:cityId', async (req, res) => {
  try {
    const barangays = await Barangay.find({ city: req.params.cityId });
    res.json(barangays);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/barangays', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Barangay name is required' });
  // Use regex for partial, case-insensitive match
  const barangays = await Barangay.find({ name: new RegExp(name, 'i') });
  res.json(barangays);
});

module.exports = router;