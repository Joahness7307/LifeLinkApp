require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/departmentModel');
const City = require('../models/cityModel');
const Province = require('../models/provinceModel');
const Region = require('../models/regionModel');

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Delete all existing departments
  await Department.deleteMany({});
  console.log('All departments deleted.');

  // Find the cities by name
  const toledo = await City.findOne({ name: /toledo/i });
  const balamban = await City.findOne({ name: /balamban/i });
  const naga = await City.findOne({ name: /naga/i });

  // Get their province and region
  const toledoProvince = await Province.findById(toledo.province).populate('region');
  const balambanProvince = await Province.findById(balamban.province).populate('region');
  const nagaProvince = await Province.findById(naga.province).populate('region');

  // Departments for Toledo City
  const toledoDepartments = [
    {
      name: 'Toledo City Police Station',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09989673822', '09156426842', '09664352435', '09778347619'],
      landlineNumbers: ['032-3225165', '032-322-5166'],
      address: 'Toledo City Police Station, Toledo City, Cebu',
      emergencyTypes: ['Police'],
      location: { latitude: 10.385180020731074, longitude: 123.64218550949322 }
    },
    {
      name: 'Toledo City Fire Station',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09662165466'],
      landlineNumbers: ['032-4679115', '032-467-9115'],
      address: 'Toledo City Fire Station, Toledo City, Cebu',
      emergencyTypes: ['Fire'],
      location: { latitude: 10.385126880131875, longitude: 123.64182197117111 }
    },
    {
      name: 'Toledo City General Hospital',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09453592755'],
      landlineNumbers: ['032-3225881', '032-3226447'],
      address: 'Toledo City General Hospital, Toledo City, Cebu',
      emergencyTypes: ['Medical'],
      location: { latitude: 10.372335707711724, longitude: 123.63872989339798 }
    },
    {
      name: 'Toledo City Health Office',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09531774692'],
      landlineNumbers: ['032-3225239'],
      address: 'Toledo City Health Office, Toledo City, Cebu',
      emergencyTypes: ['Medical'],
      location: { latitude: 10.380169519068023, longitude: 123.65768778172443 }
    },
    {
      name: 'Toledo City - City Disaster Risk Reduction & Management Operations Center/Senior Citizens Building',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09778347619', '09610546250', '09568174215'],
      landlineNumbers: ['032-3226272'],
      address: 'Toledo City CDRRMO, Toledo City, Cebu',
      emergencyTypes: ['Disaster'],
      location: { latitude: 10.374664361264701, longitude: 123.63541346762295 }
    },
    {
      name: `City Mayor's Office - Toledo City Hall`,
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09275818245'],
      landlineNumbers: ['032-3225625', '032-4678468'],
      address: `City Mayor's Office - Toledo City Hall, Toledo City, Cebu`,
      emergencyTypes: ['Government'],
      location: { latitude: 10.379979856378988, longitude: 123.65862399656457 }
    },
    {
      name: 'Toledo City Water District',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09177099504', '09176340328', '09328735309'],
      landlineNumbers: ['032-4678533', '032-4678544', '032-3226430'],
      address: 'Toledo City Water District, Toledo City, Cebu',
      emergencyTypes: ['Water'],
      location: { latitude: 10.383197993577904, longitude: 123.6499157113402 }
    },
    {
      name: 'CEBECO III - Toledo City',
      city: toledo._id,
      province: toledoProvince._id,
      region: toledoProvince.region._id,
      mobileNumbers: ['09176244406'],
      landlineNumbers: ['032-4678298', '032-3225754'],
      address: 'CEBECO III - Toledo City, Toledo City, Cebu',
      emergencyTypes: ['Electric'],
      location: { latitude: 10.38344474851382, longitude: 123.65035829362532 }
    }
  ];

  // Departments for Balamban Municipality
  const balambanDepartments = [
    {
      name: 'Balamban Municipal Police Station',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-3332190'],
      address: 'Balamban Municipal Police Station, Balamban, Cebu',
      emergencyTypes: ['Police'],
      location: { latitude: 10.503109704044315, longitude: 123.7123726795582 }
    },
    {
      name: 'Balamban Fire Station',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: ['09707786288'],
      landlineNumbers: [],
      address: 'Balamban Fire Station, Balamban, Cebu',
      emergencyTypes: ['Fire'],
      location: { latitude: 10.50359816529344, longitude: 123.71257135890552 }
    },
    {
      name: 'Cebu Provincial Hospital - Balamban',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-4652220'],
      address: 'Cebu Provincial Hospital - Balamban, Balamban, Cebu',
      emergencyTypes: ['Medical'],
      location: { latitude: 10.51092834947768, longitude: 123.71663192358122 }
    },
    {
      name: 'Balamban Municipal Disaster Risk Reduction and Management Office',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: [],
      address: 'Balamban Municipal Disaster Risk Reduction and Management Office, Balamban, Cebu',
      emergencyTypes: ['Disaster'],
      location: { latitude: 10.50520627028847, longitude: 123.71322347312949 }
    },
    {
      name: `City Mayor's Office - Balamban Municipal Hall`,
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: [],
      address: `City Mayor's Office - Balamban Municipal Hall, Balamban, Cebu`,
      emergencyTypes: ['Government'],
      location: { latitude: 10.50520627028847, longitude: 123.71322347312949 }
    },
    {
      name: 'Balamban Water District Main Office',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-4653033'],
      address: 'Balamban Water District Main Office, Balamban, Cebu',
      emergencyTypes: ['Water'],
      location: { latitude: 10.503175222510732, longitude: 123.71506983370897 }
    },
    {
      name: 'Cebeco 3 Balamban, Substation',
      city: balamban._id,
      province: balambanProvince._id,
      region: balambanProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: [],
      address: 'Cebeco 3 Balamban, Substation, Balamban, Cebu',
      emergencyTypes: ['Electric'],
      location: { latitude: 10.503486869076632, longitude: 123.7174071522785 }
    }
  ];

  // Departments for City of Naga
  const nagaDepartments = [
    {
      name: 'City of Naga Police Station',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: ['09985986338'],
      landlineNumbers: [],
      address: 'City of Naga Police Station, City of Naga, Cebu',
      emergencyTypes: ['Police'],
      location: { latitude: 10.204550144335077, longitude: 123.75938957516311 }
    },
    {
      name: 'Naga City Fire Station',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: ['09694106706'],
      landlineNumbers: [],
      address: 'Naga City Fire Station, City of Naga, Cebu',
      emergencyTypes: ['Fire'],
      location: { latitude: 10.204634381493404, longitude: 123.7591341494646 }
    },
    {
      name: 'Vicente Mendiola Center for Health Infirmary',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-4899648'],
      address: 'Vicente Mendiola Center for Health Infirmary, City of Naga, Cebu',
      emergencyTypes: ['Medical'],
      location: { latitude: 10.205888128313767, longitude: 123.75910935977726 }
    },
    {
      name: 'Cebu South General Hospital',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-2722222'],
      address: 'Cebu South General Hospital, City of Naga, Cebu',
      emergencyTypes: ['Medical'],
      location: { latitude: 10.232088787591442, longitude: 123.77115314103978 }
    },
    {
      name: 'City Hall of Naga',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-4899624'],
      address: `City Hall of Naga, City of Naga, Cebu`,
      emergencyTypes: ['Government'],
      location: { latitude: 10.207094096717105, longitude: 123.75985912221604 }
    },
    {
      name: 'Naga City Water System Incorporated',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: ['032-2389176'],
      address: 'Naga City Water System Incorporated, City of Naga, Cebu',
      emergencyTypes: ['Water'],
      location: { latitude: 10.209310485789814, longitude: 123.7562856298968 }
    },
    {
      name: 'City Disaster Risk Reduction And Management Office',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: [],
      address: 'City Disaster Risk Reduction And Management Office, City of Naga, Cebu',
      emergencyTypes: ['Disaster'],
      location: { latitude: 10.206579773644773, longitude: 123.7596575198998 }
    },
    {
      name: 'CEBECO II Naga Substation',
      city: naga._id,
      province: nagaProvince._id,
      region: nagaProvince.region._id,
      mobileNumbers: [],
      landlineNumbers: [],
      address: 'CEBECO II Naga Substation, City of Naga, Cebu',
      emergencyTypes: ['Electric'],
      location: { latitude: 10.21673235678244, longitude: 123.75788311280726 }
    }
  ];

  await Department.insertMany([...toledoDepartments, ...balambanDepartments, ...nagaDepartments]);
  console.log('Seeded departments for Toledo City, Balamban Municipality, and City of Naga.');

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch(console.error);