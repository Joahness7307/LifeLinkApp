const express = require('express');
const { loginUser, registerUser, getUserById, updateUser, deleteUser } = require('../controllers/authController');

const router = express.Router();

// login route
router.post('/login', loginUser);

// signup route
router.post('/register', registerUser);

// // get user by id route
// router.get('/:id', getUserById);

// // update user route
// router.patch('/:id', updateUser);

// // delete user route
// router.delete('/:id', deleteUser);

module.exports = router;