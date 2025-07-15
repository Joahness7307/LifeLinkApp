import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
const socket = io(SOCKET_URL); // Use env-based backend URL

const useNotifications = (userId, setNotifications) => {
  useEffect(() => {
    if (!userId) return;

    socket.emit('join', userId); // Join room with userId

    socket.on('notification', (data) => {
      setNotifications((prevNotifications) => [...prevNotifications, data.message]);
    });

    return () => {
      socket.off('notification');
    };
  }, [userId, setNotifications]);
};

export default useNotifications;