const bcrypt = require('bcrypt');

const testPasswordComparison = async () => {
  const plainTextPassword = 'admin123'; // Replace with the password you used
  const hashedPassword = '$2b$10$NIKQHLVtXNwSH1gTXwAkVeanU8SG1JLc8p1fAv6DTVWj8nQl4Pe9S'; // Replace with the hashed password from the database

  const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
  console.log('Password Match:', isMatch);
};

testPasswordComparison();