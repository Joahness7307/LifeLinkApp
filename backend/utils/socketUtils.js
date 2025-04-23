const { Server } = require('socket.io');
const User = require('../models/userModel');
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3001', // Allow requests from your frontend
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle "join" event to associate the socket with a userId
    socket.on('join', (userId) => {
      console.log(`User with ID ${userId} joined room ${userId}`);
      socket.join(userId); // Assign user to a room
    });

    // Handle location updates from responders and persist to DB
    socket.on('updateLocation', async (data) => {
      const { responderId, latitude, longitude } = data;
      console.log('Responder location update:', data);

      try {
        await User.findByIdAndUpdate(responderId, {
          location: { latitude, longitude },
        });
        // Optionally, still emit the real-time update if needed for other listeners
        io.to(responderId).emit(`locationUpdate:${responderId}`, { latitude, longitude });
      } catch (error) {
        console.error('Error updating responder location in DB:', error);
      }
    });

    // Handle request for responder location from DB
    socket.on('requestResponderLocation', async (responderId) => {
      console.log('Got location request for:', responderId);
      try {
        const user = await User.findById(responderId);
        if (user?.location?.latitude && user?.location?.longitude) {
          const { latitude, longitude } = user.location;
          io.to(responderId).emit(`locationUpdate:${responderId}`, { latitude, longitude });
        } else {
          console.log('Responder location not found in DB');
          // Optionally emit an event to inform the client that the location is not available
          io.to(responderId).emit(`locationUpdate:${responderId}`, null);
        }
      } catch (error) {
        console.error('Error fetching responder location from DB:', error);
        // Optionally emit an error event to the client
        io.to(responderId).emit(`locationUpdateError:${responderId}`, 'Failed to fetch location');
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
};

// Function to send a notification to either a user or responder
const sendNotification = ({ userId, responderId, message, alertId }) => {
  const recipientId = userId || responderId;
  if (!recipientId) {
    console.error('sendNotification: recipientId is undefined');
    return;
  }

  console.log(`Sending notification to user ${recipientId}: ${message}`);
  io.to(recipientId.toString()).emit('notification', { message, alertId });
};

module.exports = { io, initSocket, sendNotification };