const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { loginUser, registerUser, sendPasswordResetEmail, resetPassword } = require('../controllers/authController');
const { getUserProfile, getUserById, uploadProfilePicture, updateUser, deleteUser } = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// login route
router.post('/login', loginUser);

// signup route
router.post('/register', registerUser);

// email verification route
// router.get('/verify-email', verifyEmail);

// // resend verification email route
// router.post('/resend-verification', resendVerificationEmail);

// FCM token route for push notifications
router.post('/fcm-token', requireAuth, async (req, res) => {
  const { fcmToken } = req.body;
  await User.findByIdAndUpdate(req.user._id, { fcmToken });
  res.json({ success: true });
});

// get users profile route
router.get('/me', requireAuth, getUserProfile);

// get user by id route
router.get('/:id', requireAuth, getUserById);

// upload profile picture route
router.post('/:id/profile-picture', upload.single('profilePicture'), requireAuth, uploadProfilePicture);

// update user route
router.patch('/:id', updateUser);

// delete user route
router.delete('/:id', deleteUser);

module.exports = router;