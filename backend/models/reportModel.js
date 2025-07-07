const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  emergencyId: { type: Schema.Types.ObjectId, ref: 'Emergency' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  address: { type: String },
  message: { type: String },
  imageURLs: [{ type: String }], // Array of images
  videoURLs: [{ type: String }], // Array of videos
  type: { type: String, required: true }, // e.g. 'Fire', 'Police', etc.
  subtype: { type: String },
  referenceNumber: { type: String, unique: true }, 
  clientSubmittedAt: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  isFake: { type: Boolean, default: false },
  fakeReason: { type: String, default: '' },
  statusHistory: [{
    status: String,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);