const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProvinceSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  latitude: { type: Number },    // <-- Add this
  longitude: { type: Number }    // <-- Add this
});

module.exports = mongoose.model('Province', ProvinceSchema);
