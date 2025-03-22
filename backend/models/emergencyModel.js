const mongoose = require('mongoose');
const Agency = require('../models/agencyModel');
const Schema = mongoose.Schema;

const emergencySchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['FIRE', 'ACCIDENT', 'MEDICAL', 'CRIME', 'FLOOD', 'OTHERS']
  },
  description: {
    type: String,
    required: true
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Agency,
    required: true
  }
  
}, {
  timestamps: true
});

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;