require('./seeds/syncAddressData'); // Import the sync script
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const passport = require('passport');
// require('./config/passport'); // Import Passport configuration
const mongoose = require('mongoose');
const http = require('http'); // Import HTTP to create a server
const path = require('path');
const { initSocket } = require('./utils/socketUtils'); // Import initSocket

const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes'); // Add Google Auth Routes
const addressRoutes = require('./routes/addressRoutes'); // Import address routes
const emergencyRoutes = require('./routes/emergencyRoutes'); // Import emergency routes

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Enable CORS for all origins or specify allowed origins
app.use(cors({ origin: true, credentials: true }));

// Add this line right after CORS middleware:
app.options('*', cors());

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} at ${new Date()}`);
  next();
});

// Initialize Passport
// app.use(passport.initialize());

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/auth', authRoutes);

// MongoDB connection
const dbURI = process.env.MONGO_URI;

// Add this check at startup
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

mongoose
  .connect(dbURI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => console.error('Error connecting to MongoDB:', error));

module.exports = { server };