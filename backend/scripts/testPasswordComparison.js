const bcrypt = require('bcrypt');

const plainPassword = 'passSA@123';
const hashedPassword = '$2b$10$DyMcK5JCKEukOgzfHjIKBO3Ta/GkGyrDVd20R7tpCzFnVKqWHRiOS';

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Password match:', result);
  }
});