import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';

const ResponderDashboard = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('User object in ResponderDashboard:', user); // Debug log

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
        const response = await fetch(`http://localhost:3001/responder/alerts`, {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
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