const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  category: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  message: { type: String },
  imageURL: { type: String },
  cloudinaryPublicId: { type: String },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

// Middleware to remove the alert from associated documents when deleted
alertSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Agency = require('./agencyModel');
    const Emergency = require('./emergencyModel');

    // Remove the alert reference from the associated agency
    if (doc.agencyId) {
      await Agency.findByIdAndUpdate(doc.agencyId, {
        $pull: { alerts: doc._id },
      });
    }

    // Remove the alert reference from the associated emergency
    if (doc.emergencyId) {
      await Emergency.findByIdAndUpdate(doc.emergencyId, {
        $pull: { alerts: doc._id },
      });
    }
  }
});

module.exports = mongoose.model('Alert', alertSchema);