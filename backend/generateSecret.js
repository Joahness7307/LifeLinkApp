const crypto = require('crypto');

// Generate a 64-byte random secret and convert it to hex format
const secret = crypto.randomBytes(64).toString('hex');

// Output the secret to the console
console.log('Generated Secret:', secret);
