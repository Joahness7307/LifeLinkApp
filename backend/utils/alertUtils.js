const Alert = require('../models/alertModel');

const createAlertForAgency = async ({ userId, agencyId, category, contactNumber, location, message, imageURL }) => {
  const alert = await Alert.create({
    userId,
    agencyId,
    category,
    contactNumber,
    location,
    message,
    imageURL,
    status: 'pending',
  });

  console.log('Category:', category);

  const agency = await Department.findById(agencyId);
  if (agency) {
    agency.alerts.push(alert._id);
    await agency.save();
  }

  return alert;
};

module.exports = { createAlertForAgency };