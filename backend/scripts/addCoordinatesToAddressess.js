require('dotenv').config();
const mongoose = require('mongoose');
const City = require('../models/cityModel');
const Barangay = require('../models/barangayModel');

const MONGO_URI = process.env.MONGO_URI;

// Supported cities/municipalities with coordinates
const cityCoords = [
  { name: /toledo/i, latitude: 10.3773, longitude: 123.6386 },
  { name: /balamban/i, latitude: 10.505206, longitude: 123.713223 },
  { name: /naga/i, latitude: 10.2093, longitude: 123.7580 }
];

// Optionally, add specific barangay coordinates here if you have them
// Otherwise, set barangay coordinates to their parent city
async function updateBarangaysForCity(cityName, cityLat, cityLng) {
  const city = await City.findOne({ name: cityName });
  if (!city) return;
  const barangays = await Barangay.find({ city: city._id });
  for (const brgy of barangays) {
    await Barangay.findByIdAndUpdate(brgy._id, {
      latitude: cityLat,
      longitude: cityLng
    });
    console.log(`✅ Updated ${brgy.name} in ${city.name}`);
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);

  for (const city of cityCoords) {
    const updated = await City.findOneAndUpdate(
      { name: city.name },
      { latitude: city.latitude, longitude: city.longitude }
    );
    if (updated) {
      console.log(`✅ Updated city: ${updated.name}`);
      await updateBarangaysForCity(updated.name, city.latitude, city.longitude);
    } else {
      console.warn(`❌ City not found: ${city.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('Coordinates update complete.');
}

main().catch(console.error);