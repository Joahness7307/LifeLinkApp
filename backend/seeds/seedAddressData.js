require('dotenv').config();
const mongoose = require('mongoose');
const Region = require('../models/regionModel');
const Province = require('../models/provinceModel');
const City = require('../models/cityModel');
const Barangay = require('../models/barangayModel');

const API_BASE_URL = process.env.API_BASE_URL;

async function fetchData(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`❌ Error fetching data from ${url}:`, err.message);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
        console.log(`🔄 Retrying (${i + 1}/${retries})...`);
      } else {
        throw err;
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const seedAddressData = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Clean up: Remove any documents with missing or empty code
    await Region.deleteMany({ $or: [{ code: { $exists: false } }, { code: '' }] });
    await Province.deleteMany({ $or: [{ code: { $exists: false } }, { code: '' }] });
    await City.deleteMany({ $or: [{ code: { $exists: false } }, { code: '' }] });
    await Barangay.deleteMany({ $or: [{ code: { $exists: false } }, { code: '' }] });

    console.log("🌐 Fetching regions...");
    const regions = await fetchData(`${API_BASE_URL}/regions`);

    for (const region of regions) { 
      if (!region.code) continue;

      const regionDetails = await fetchData(`${API_BASE_URL}/regions/${region.code}`);
      const createdRegion = await Region.findOneAndUpdate(
        { code: region.code },
        {
          name: region.name,
          code: region.code,
          latitude: regionDetails.lat,
          longitude: regionDetails.lng
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Region: ${region.name} (${region.code}) lat: ${regionDetails.lat}, lng: ${regionDetails.lng}`);

      const provinces = await fetchData(`${API_BASE_URL}/regions/${region.code}/provinces`);
      for (const province of provinces) {
        if (!province.code) continue;

        const provinceDetails = await fetchData(`${API_BASE_URL}/provinces/${province.code}`);
        const createdProvince = await Province.findOneAndUpdate(
          { code: province.code },
          {
            name: province.name,
            code: province.code,
            region: createdRegion._id,
            latitude: provinceDetails.lat,
            longitude: provinceDetails.lng
          },
          { upsert: true, new: true }
        );
        console.log(`  ✅ Province: ${province.name} (${province.code}) lat: ${provinceDetails.lat}, lng: ${provinceDetails.lng}`);

        // Cities and municipalities
        const cities = await fetchData(`${API_BASE_URL}/provinces/${province.code}/cities`);
        const municipalities = await fetchData(`${API_BASE_URL}/provinces/${province.code}/municipalities`);
        const allLGUs = [...cities, ...municipalities];

        for (const lgu of allLGUs) {
          if (!lgu.code) continue;
          let lguDetails, lguType = "City";
          try {
            lguDetails = await fetchData(`${API_BASE_URL}/cities/${lgu.code}`);
            lguType = "City";
          } catch {
            lguDetails = await fetchData(`${API_BASE_URL}/municipalities/${lgu.code}`);
            lguType = "Municipality";
          }

          // Fallback for city lat/lng: use province, then region
          let cityLat = lguDetails.lat;
          let cityLng = lguDetails.lng;
          let cityFallback = '';
          if (!cityLat || !cityLng) {
            if (createdProvince.latitude && createdProvince.longitude) {
              cityLat = createdProvince.latitude;
              cityLng = createdProvince.longitude;
              cityFallback = ' (province fallback)';
            } else if (createdRegion.latitude && createdRegion.longitude) {
              cityLat = createdRegion.latitude;
              cityLng = createdRegion.longitude;
              cityFallback = ' (region fallback)';
            }
          }

          const createdCity = await City.findOneAndUpdate(
            { code: lgu.code },
            {
              name: lgu.name,
              code: lgu.code,
              province: createdProvince._id,
              latitude: cityLat,
              longitude: cityLng,
              type: lguType
            },
            { upsert: true, new: true }
          );
          console.log(`    ✅ ${lguType}: ${lgu.name} (${lgu.code}) lat: ${cityLat}, lng: ${cityLng}${cityFallback}`);

          // Barangays
          let barangays = [];
          try {
            barangays = await fetchData(`${API_BASE_URL}/cities/${lgu.code}/barangays`);
          } catch {
            try {
              barangays = await fetchData(`${API_BASE_URL}/municipalities/${lgu.code}/barangays`);
            } catch {
              console.warn(`      ⚠️ No barangays found for ${lgu.name} (${lgu.code})`);
              continue;
            }
          }

          for (const barangay of barangays) {
            if (!barangay.code) continue;
            let barangayDetails = {};
            try {
              barangayDetails = await fetchData(`${API_BASE_URL}/barangays/${barangay.code}`);
            } catch {
              console.warn(`      ⚠️ No details for barangay ${barangay.name} (${barangay.code})`);
            }

            // Fallback for barangay lat/lng: use city, then province, then region
            let brgyLat = barangayDetails.lat;
            let brgyLng = barangayDetails.lng;
            let brgyFallback = '';
            if (!brgyLat || !brgyLng) {
              if (createdCity.latitude && createdCity.longitude) {
                brgyLat = createdCity.latitude;
                brgyLng = createdCity.longitude;
                brgyFallback = ' (city fallback)';
              } else if (createdProvince.latitude && createdProvince.longitude) {
                brgyLat = createdProvince.latitude;
                brgyLng = createdProvince.longitude;
                brgyFallback = ' (province fallback)';
              } else if (createdRegion.latitude && createdRegion.longitude) {
                brgyLat = createdRegion.latitude;
                brgyLng = createdRegion.longitude;
                brgyFallback = ' (region fallback)';
              }
            }

            await Barangay.findOneAndUpdate(
              { code: barangay.code },
              {
                name: barangay.name,
                code: barangay.code,
                city: createdCity._id,
                latitude: brgyLat,
                longitude: brgyLng
              },
              { upsert: true, new: true }
            );
            console.log(`      ✅ Barangay: ${barangay.name} (${barangay.code}) lat: ${brgyLat}, lng: ${brgyLng}${brgyFallback}`);
          }
          await sleep(300); // Reduce delay for faster seeding
        }
      }
    }

    console.log('🌟 Address data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding address data:', error.message);
    process.exit(1);
  }
};

seedAddressData();