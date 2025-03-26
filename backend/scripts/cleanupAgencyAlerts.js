const mongoose = require('mongoose');
const Agency = require('../models/agencyModel');
const Alert = require('../models/alertModel');
require('dotenv').config({ path: '../.env' });

const cleanupAgencyAlerts = async () => {
  try {
     // Debug: Check if MONGO_URI is loaded
     console.log('MONGO_URI:', process.env.MONGO_URI);
     
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database');
    
    // Fetch all agencies
    const agencies = await Agency.find();

    for (const agency of agencies) {
      // Filter out invalid alert references
      const validAlerts = [];
      for (const alertId of agency.alerts) {
        const alertExists = await Alert.findById(alertId);
        if (alertExists) {
          validAlerts.push(alertId); // Keep valid alert references
        }
      }

      // Update the agency's alerts array with only valid references
      agency.alerts = validAlerts;
      await agency.save();
      console.log(`Cleaned up alerts for agency: ${agency._id}`);
    }

    console.log('Agency alerts cleanup completed');
    process.exit();
  } catch (error) {
    console.error('Error cleaning up agency alerts:', error);
    process.exit(1);
  }
};

cleanupAgencyAlerts();