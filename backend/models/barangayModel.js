// backend/models/barangayModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BarangaySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  latitude: { type: Number },    // <-- add this
  longitude: { type: Number }    // <-- add this
});

module.exports = mongoose.model('Barangay', BarangaySchema);