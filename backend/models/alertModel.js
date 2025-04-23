const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  category: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  message: { type: String, required: false, default: 'No message provided' },
  imageURL: { type: String, required: false },
  cloudinaryPublicId: { type: String, required: false },
  status: { type: String, default: 'pending' },
}, { timestamps: true });

alertSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Agency = require('./agencyModel');
    const Emergency = require('./emergencyModel');

    if (doc.agencyId) {
      await Agency.findByIdAndUpdate(doc.agencyId, {
        $pull: { alerts: doc._id },
      });
    }

    if (doc.emergencyId) {
      await Emergency.findByIdAndUpdate(doc.emergencyId, {
        $pull: { alerts: doc._id },
      });
    }
  }
  console.log('Alert saved:', doc); // Debug log
});

module.exports = mongoose.model('Alert', alertSchema);
