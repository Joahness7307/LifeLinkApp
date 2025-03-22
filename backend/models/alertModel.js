const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const alertSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  emergencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergency',
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  imageURL: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'responding', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true,
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;