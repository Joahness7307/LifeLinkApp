const { Server } = require('socket.io');
const io = new Server();

const initSocket = (server) => {
  io.attach(server, {
    cors: {
      origin: 'http://localhost:3001', // Allow requests from your frontend
      methods: ['GET', 'POST'], // Allow specific HTTP methods
      credentials: true, // Allow cookies and authentication headers
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle the "join" event to associate the socket with a userId
    socket.on('join', (userId) => {
      console.log(`User with ID ${userId} joined room ${userId}`);
      socket.join(userId); // Join the user to a room with their userId
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
};

const sendNotification = ({ userId, responderId, message, alertId }) => {
  const recipientId = userId || responderId; // Use responderId if userId is undefined
  if (!recipientId) {
    console.error('sendNotification: recipientId is undefined');
    return;
  }

  console.log(`Sending notification to user ${recipientId}: ${message}`);
  io.to(recipientId.toString()).emit('notification', { message, alertId });
};

module.exports = { io, initSocket, sendNotification };