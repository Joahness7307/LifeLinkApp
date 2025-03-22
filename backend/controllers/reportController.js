const Alert = require('../models/alertModel');
const Emergency = require('../models/emergencyModel');
const Agency = require('../models/agencyModel');
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, 'image-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('image'); // 'image' is the field name in the form

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

const submitReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err });
    }

    const { emergencyId, userId, message } = req.body;
    const imageURL = req.file ? `/uploads/${req.file.filename}` : ''; // Get the file path if exists

    try {
      // Check if emergencyId is provided
      if (!emergencyId) {
        return res.status(400).json({ error: 'Emergency ID is required' });
      }

      // Find the existing emergency record
      const emergency = await Emergency.findById(emergencyId);

      if (!emergency) {
        return res.status(404).json({ error: 'Emergency not found' });
      }

      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Find agencies associated with the emergency type
      const agencies = await Agency.find({ categories: emergency.type });

      if (agencies.length === 0) {
        return res.status(404).json({ error: 'No agencies found for this emergency type' });
      }

      // Create an alert for each agency
      const alerts = await Promise.all(
        agencies.map(async (agency) => {
          const alert = await Alert.create({
            userId: user._id,
            emergencyId: emergency._id,
            agencyId: agency._id,
            location: user.address,        // Use user's address from their profile
            contactNumber: user.phoneNumber, // Use user's phone number from their profile
            message: message || '',         // Optional message
            imageURL,                       // Optional image URL
          });
          return alert;
        })
      );

      res.status(201).json({ message: 'Emergency report submitted successfully', emergency, alerts });
    } catch (error) {
      console.error('Error submitting report:', error);
      res.status(400).json({ error: error.message });
    }
  });
};

module.exports = {
  submitReport
};