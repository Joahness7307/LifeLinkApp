const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const agencySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  categories: [{
    type: String,
    required: true,
    enum: ['FIRE', 'ACCIDENT', 'MEDICAL', 'CRIME', 'FLOOD', 'OTHERS']
  }],
  alerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }]
}, {
  timestamps: true
});

const Agency = mongoose.model('Agency', agencySchema);

module.exports = Agency;