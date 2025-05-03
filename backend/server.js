require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // Import HTTP to create a server
const path = require('path');
const { initSocket } = require('./utils/socketUtils'); // Import initSocket

const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const responderRoutes = require('./routes/responderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Enable CORS for all origins or specify allowed origins
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} at ${new Date()}`);
  next();
});

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/responder', responderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/notifications', notificationRoutes);

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
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => console.error('Error connecting to MongoDB:', error));

module.exports = { server };