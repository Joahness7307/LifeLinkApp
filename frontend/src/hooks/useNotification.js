import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

const useNotifications = (userId, setNotifications) => {
  useEffect(() => {
    if (!userId) return;

    // console.log(`Joining room for userId: ${userId}`);
    socket.emit('join', userId); // Emit the "join" event with the userId

    socket.on('notification', (data) => {
      // console.log('Received notification:', data.message);
      setNotifications((prevNotifications) => [...prevNotifications, data.message]);
    });

    return () => {
      socket.off('notification');
    };
  }, [userId, setNotifications]);
};

export default useNotifications;