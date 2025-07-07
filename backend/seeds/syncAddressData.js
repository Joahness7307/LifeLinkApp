require('dotenv').config();
const nodeCron = require('node-cron');
const { exec } = require('child_process');

// Schedule it every Sunday at 2 AM
nodeCron.schedule('0 2 * * 0', () => {
  console.log("🔄 Running weekly sync...");
  exec('node seeds/seedAddressData.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Sync error: ${error.message}`);
      return;
    }
    console.log(`🌟 Sync completed:\n${stdout}`);
    if (stderr) {
      console.error(`⚠️ Sync warnings:\n${stderr}`);
    }
  });
});
