import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthContext from '../hooks/useAuthContext';
import { getLocation } from '../utils/geolocationUtils';
import '../styles/ResponderDashboard.css'; // Import your CSS file

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

const ResponderDashboard = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // console.log('User object in ResponderDashboard:', user); // Debug log

    // Check if the user is logged in and has the "responder" role
    if (!user || user.role !== 'responder') {
      navigate('/unauthorized');
      return;
    }

    // Check if the responder is associated with an agency
    if (!user.agencyId) {
      console.error('Responder does not have an associated agencyId.');
      setError('You are not associated with any agency.');
      setLoading(false);
      return;
    }

    // Fetch alerts for the responder's agency
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/responder/alerts`, {
          headers: {
            Authorization: `Bearer ${user.token}`, // Include the token for authorization
          },
        });

        const json = await response.json();

        if (!response.ok) {
          setError(json.error);
          return;
        }

        setAlerts(json);
      } catch (err) {
        setError('Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      // Join the responder's room
      socket.emit('join', user._id);

      // Continuously emit the responder's location
      const locationInterval = setInterval(() => {
        getLocation(
          (latitude, longitude) => {
            console.log('Emitting responder location:', { latitude, longitude });
            socket.emit('updateLocation', { responderId: user._id, latitude, longitude });
          },
          (error) => {
            console.error('Error fetching location:', error);
          }
        );
      }, 5000); // Emit location every 5 seconds

      return () => clearInterval(locationInterval); // Cleanup on component unmount
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='responder-container'>
      <h1>Responder Dashboard</h1>
      {alerts.length === 0 ? (
        <p>No alerts found for your agency.</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert._id}>
              <strong>Message:</strong> {alert.message} <br />
              <strong>Status:</strong> {alert.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResponderDashboard;