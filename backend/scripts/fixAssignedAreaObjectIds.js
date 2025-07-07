require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

const MONGO_URI = process.env.MONGO_URI;

async function fixAssignedArea() {
  await mongoose.connect(MONGO_URI);

  // Province Admins
  await User.updateMany(
    { role: "provinceAdmin" },
    [
      {
        $set: {
          "assignedArea.region": { $toObjectId: "$assignedArea.region" },
          "assignedArea.province": { $toObjectId: "$assignedArea.province" }
        }
      }
    ]
  );

  // City Admins
  await User.updateMany(
    { role: "cityAdmin" },
    [
      {
        $set: {
          "assignedArea.region": { $toObjectId: "$assignedArea.region" },
          "assignedArea.province": { $toObjectId: "$assignedArea.province" },
          "assignedArea.city": { $toObjectId: "$assignedArea.city" }
        }
      }
    ]
  );

  console.log('Assigned area fields fixed!');
  await mongoose.disconnect();
}

fixAssignedArea();