require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const responderRoutes = require('./routes/responderRoutes'); // Import responderRoutes
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
const passwordRoutes = require('./routes/passwordRoutes'); // Import password routes
const path = require('path');

const app = express();

// Enable CORS for all origins or specify allowed origins
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} at ${new Date()}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/user', userRoutes);
app.use('/alerts', alertRoutes);
app.use('/agencies', agencyRoutes);
app.use('/emergencies', emergencyRoutes);
app.use('/reports', reportRoutes);
app.use('/responder', responderRoutes); // Mount responder routes
app.use('/admin', adminRoutes); // Mount admin routes
app.use('/password', passwordRoutes); // Mount password routes

// MongoDB connection
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });