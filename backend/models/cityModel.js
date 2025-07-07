const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CitySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
  latitude: { type: Number },    // <-- add this
  longitude: { type: Number }    // <-- add this
});

module.exports = mongoose.model('City', CitySchema);
