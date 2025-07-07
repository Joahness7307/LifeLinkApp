const express = require('express');
const emergencySubtypes = require('../config/emergencySubtypes');

const router = express.Router();

router.get('/types', (req, res) => {
  res.json(Object.keys(emergencySubtypes));
});

router.get('/subtypes/:type', (req, res) => {
  const { type } = req.params;
  const subtypes = emergencySubtypes[type];

  if (!subtypes) {
    return res.status(404).json({ error: 'Emergency type not found' });
  }

  res.json(subtypes);
});

module.exports = router;