const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegionSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  latitude: { type: Number },    // <-- Add this
  longitude: { type: Number }    // <-- Add this
});

module.exports = mongoose.model('Region', RegionSchema);
