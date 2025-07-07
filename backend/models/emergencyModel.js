const mongoose = require('mongoose');
const Department = require('./departmentModel');
const Schema = mongoose.Schema;

const emergencySchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'Fire',
      'Police',
      'Medical',
      'Disaster',
      'Government',
      'Water',
      'Electric'
    ]
  },
  description: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Department,
    required: true
  }
}, {
  timestamps: true
});

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;