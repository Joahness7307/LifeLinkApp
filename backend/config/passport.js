const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel'); // Import your User model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Add this to your .env file
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Add this to your .env file
      callbackURL: '/auth/google/callback', // Redirect URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Split the full name into firstName and lastName
          const [firstName, ...lastNameParts] = profile.displayName.split(' ');
          const lastName = lastNameParts.join(' ');

          // Create a new user if not found
          user = await User.create({
            userName: `${firstName} ${lastName}`, // Combine firstName and lastName for userName
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value || '', // Use Google avatar if available
            password: null, // No password for Google-authenticated users
            contactNumber: '', // Default empty contactNumber
            address: {
              country: '',
              region: '',
              province: '',
              city: '',
              cityCode: '', // Added cityCode
              barangay: '',
              barangayCode: '', // Added barangayCode
            }, // Default empty address
            role: 'user', // Default role
            isProfileComplete: false, // Mark profile as incomplete
          });
        }

        // Include the full user profile in the req.user object
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});