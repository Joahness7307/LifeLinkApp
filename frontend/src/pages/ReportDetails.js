import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import '../styles/ReportDetails.css'; // Import your CSS file

const ReportDetails = ({ setNotifications }) => {
  const { alertId } = useParams(); // Get the alertId from the URL
  const { user } = useAuthContext(); // Get the logged-in user details
  const [alertDetails, setAlertDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlertDetails = async () => {
      try {
        const token = user?.token; // Retrieve the token from context
        if (!token) {
          throw new Error('User is not authenticated');
        }

        const response = await fetch(`http://localhost:3001/alerts/${alertId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch alert details');
        }

        setAlertDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertDetails();
  }, [alertId, user]);

  const handleRespond = async () => {
    try {
      const token = user?.token; // Retrieve the token from context
      if (!token) {
        throw new Error('User is not authenticated');
      }

      const response = await fetch(`http://localhost:3001/alerts/${alertId}/respond`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alert status');
      }

      // Notify the user and redirect to another page if needed
      alert('You are now responding to this alert.');

      // Update the notification in the Navbar
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
        notif.alertId === alertId ? { ...notif, isRead: true } : notif
      )
    );

    // Redirect to another page if needed
    navigate('/ResponderDashboard');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getOptimizedImageUrl = (imageURL) => {
    if (!imageURL) return '';
    // Add Cloudinary transformations to the URL
    return imageURL.replace('/upload/', '/upload/q_auto,f_auto,w_auto,dpr_auto/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="report-details-container">
      <h1 className="report-title">Report Details</h1>
      <div className="report-content">
        <p><strong>Emergency Type:</strong> {alertDetails.category || 'N/A'}</p>
        <p><strong>Message:</strong> {alertDetails.message}</p>
        <p><strong>Location:</strong> {alertDetails.location}</p>
        <p><strong>Contact Number:</strong> {alertDetails.contactNumber}</p>
        <p><strong>Submitted By:</strong> {alertDetails.userId?.userName}</p>
        <p><strong>Agency:</strong> {alertDetails.agencyId?.name}</p>
        <p><strong>Status:</strong> {alertDetails.status}</p>
        {alertDetails.imageURL && (
          <div className="report-image-container">
            <img
              src={getOptimizedImageUrl(alertDetails.imageURL)}
              alt="Report"
              className="report-image"
              loading="lazy"
            />
          </div>
        )}
      </div>
      {/* Show the Respond button only for responders and when the status is pending */}
      {user?.role === 'responder' && alertDetails.status === 'pending' && (
        <button
          onClick={handleRespond}
          className="respond-button"
        >
          Respond
        </button>
      )}
    </div>
  );
};

export default ReportDetails;