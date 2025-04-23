const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Add error handling for missing environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials in environment variables');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add a test function to verify configuration
const testConfig = async () => {
  try {
    const result = await cloudinary.api.ping();
    // console.log('Cloudinary configuration is valid:', result);
    
    // Try to get account details
    const account = await cloudinary.api.usage();
  } catch (error) {
    console.error('Cloudinary configuration error:', error);
    process.exit(1);
  }
};

// Run the test when the configuration is loaded
testConfig();

// Add delivery and transformation settings
const defaultDeliverySettings = {
  delivery_type: 'upload',
  format: 'auto',
  quality: 'auto'
};

module.exports = { 
  cloudinary,
  defaultDeliverySettings
};