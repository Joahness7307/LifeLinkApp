const Agency = require('../models/agencyModel');

// Get all agencies
const getAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find({});
    res.status(200).json(agencies);
  } catch (error) {
    console.log("Error fetching agencies: ", error);
    res.status(400).json({ error: error.message });
  }
};

// Get single agency
const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }
    res.status(200).json(agency);
  } catch (error) {
    console.log("Error fetching agency: ", error);
    res.status(400).json({ error: error.message });
  }
};

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
  getAgencies,
  getAgencyById,
  updateAgencyCategories,
};