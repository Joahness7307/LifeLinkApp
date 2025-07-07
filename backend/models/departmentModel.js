const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: String,
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  mobileNumbers: [{ type: String, default: '' }],   // Array of mobile numbers
  landlineNumbers: [{ type: String, default: '' }], // Array of landline numbers
  location: {
    latitude: { type: Number },
    longitude:{ type: Number }
  },
  address: String,
  emergencyTypes: [String]
});

module.exports = mongoose.model('Department', departmentSchema);