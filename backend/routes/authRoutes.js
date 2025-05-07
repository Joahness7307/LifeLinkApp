const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      const token = jwt.sign(
        {
          id: req.user._id, // Include the user ID in the token
          userName: req.user.userName,
          email: req.user.email,
          contactNumber: req.user.contactNumber,
          address: req.user.address,
          role: req.user.role,
          isProfileComplete: req.user.isProfileComplete,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // console.log('Generated token:', token); // Debug log

      if (!req.user.isProfileComplete) {
        // Redirect to Complete Profile page if profile is incomplete
        // console.log('Redirecting user to:', '/complete-profile');
        res.redirect(`http://localhost:3001/auth/google/callback?token=${token}&redirect=complete-profile`);
      } else {
        // Redirect to UserDashboard if profile is complete
        // console.log('Redirecting user to:', '/UserDashboard');
        res.redirect(`http://localhost:3001/auth/google/callback?token=${token}&redirect=UserDashboard`);
      }
    } catch (error) {
      console.error('Error during Google OAuth callback:', error);
      res.redirect(`http://localhost:3001/login?error=Google OAuth failed. Please try again.`);
    }
  }
);

module.exports = router;