const express = require('express');
const { loginUser, registerUser } = require('../controllers/authController');
const { getUserById, updateUser, deleteUser, completeProfile } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// login route
router.post('/login', loginUser);

// signup route
router.post('/register', registerUser);

// get user by id route
router.get('/:id', requireAuth, getUserById);

// update user route
router.patch('/:id', updateUser);

// delete user route
router.delete('/:id', deleteUser);

// complete profile route
router.post('/complete-profile', requireAuth, completeProfile);

module.exports = router;