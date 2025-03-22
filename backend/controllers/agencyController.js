const Agency = require('../models/agencyModel');

const createAgency = async (req, res) => {
  const { name, address, contactNumber, email, categories } = req.body;

  try {
    const agency = await Agency.create({ name, address, contactNumber, email, categories });
    res.status(201).json(agency);
  } catch (error) {
    console.log("Error creating agency: ", error);
    res.status(400).json({ error: error.message });
  }
};

const updateAgencyCategories = async (req, res) => {
  const { agencyId, categories } = req.body;

  try {
    const agency = await Agency.findByIdAndUpdate(
      agencyId,
      { $addToSet: { categories: { $each: categories } } },
      { new: true }
    );

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.status(200).json(agency);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createAgency,
  updateAgencyCategories,
};