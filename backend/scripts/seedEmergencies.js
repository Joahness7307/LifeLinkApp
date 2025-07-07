require('dotenv').config();
const mongoose = require('mongoose');
const Emergency = require('../models/emergencyModel');
const Department = require('../models/departmentModel');

const MONGO_URI = process.env.MONGO_URI;

const emergencyDepartmentMap = [
  // Toledo City
  { type: 'Police', departmentName: 'Toledo City Police Station' },
  { type: 'Fire', departmentName: 'Toledo City Fire Station' },
  { type: 'Medical', departmentName: 'Toledo City General Hospital' },
  { type: 'Disaster', departmentName: 'Toledo City - City Disaster Risk Reduction & Management Operations Center/Senior Citizens Building' },
  { type: 'Government', departmentName: `City Mayor's Office - Toledo City Hall` },
  { type: 'Water', departmentName: 'Toledo City Water District' },
  { type: 'Electric', departmentName: 'CEBECO III - Toledo City' },

  // Balamban
  { type: 'Police', departmentName: 'Balamban Municipal Police Station' },
  { type: 'Fire', departmentName: 'Balamban Fire Station' },
  { type: 'Medical', departmentName: 'Cebu Provincial Hospital - Balamban' },
  { type: 'Disaster', departmentName: 'Balamban Municipal Disaster Risk Reduction and Management Office' },
  { type: 'Government', departmentName: `City Mayor's Office - Balamban Municipal Hall` },
  { type: 'Water', departmentName: 'Balamban Water District Main Office' },
  { type: 'Electric', departmentName: 'Cebeco 3 Balamban, Substation' },

  // City of Naga
  { type: 'Police', departmentName: 'City of Naga Police Station' },
  { type: 'Fire', departmentName: 'Naga City Fire Station' },
  { type: 'Medical', departmentName: 'Vicente Mendiola Center for Health Infirmary' },
  { type: 'Medical', departmentName: 'Cebu South General Hospital' },
  { type: 'Government', departmentName: 'City Hall of Naga' },
  { type: 'Water', departmentName: 'Naga City Water System Incorporated' },
  { type: 'Disaster', departmentName: 'City Disaster Risk Reduction And Management Office' },
  { type: 'Electric', departmentName: 'CEBECO II Naga Substation' }
];

async function seedEmergencies() {
  await mongoose.connect(MONGO_URI);

  // Optionally clear old emergencies
  await Emergency.deleteMany({});
  console.log('All emergencies deleted.');

  for (const item of emergencyDepartmentMap) {
  const department = await Department.findOne({ name: item.departmentName });
  if (!department) {
    console.warn(`No department found for: ${item.departmentName}`);
    continue;
  }
  await Emergency.create({
    type: item.type,
    description: `Emergency of type ${item.type}`,
    departmentId: department._id
  });
  console.log(`Seeded emergency: ${item.type} -> ${department.name} (${department.city})`);
}

  console.log('🌟 Emergencies seeded successfully!');
  process.exit(0);
}

seedEmergencies().catch(console.error);