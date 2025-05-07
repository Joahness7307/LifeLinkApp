const bcrypt = require('bcrypt');

const plainPassword = 'passA@123';
const hashedPassword = '$2b$10$1vAU9gSmjQ.VewB/NOcU2erS7NzkwscnIIo/mQRxFrCisFABSrQNy';

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', result);
  }
});