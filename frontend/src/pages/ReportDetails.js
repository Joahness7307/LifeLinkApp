import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthContext from '../hooks/useAuthContext';
import Modal from '../components/Modal'; // Import the Modal component
import Map from '../components/Map'; // Import the Map component
import '../styles/ReportDetails.css'; // Import your CSS file

const socket = io('http://localhost:3000'); // Connect to the backend Socket.IO server
socket.on('connect', () => {
  // console.log('Socket connected with ID:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err);
});

const ReportDetails = ({ setNotifications }) => {
  const { alertId } = useParams(); // Get the alertId from the URL
  const { user } = useAuthContext(); // Get the logged-in user details
  const [alertDetails, setAlertDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // State to control the modal
  const [modalMessage, setModalMessage] = useState(''); // State for the modal message
  const [responderLocation, setResponderLocation] = useState(null); // Responder's current location
  const [distance, setDistance] = useState(null); // Distance between responder and alert location
  const [alertDetailsLoaded, setAlertDetailsLoaded] = useState(false); // Track if alert details are loaded
  const navigate = useNavigate();

  // Fetch alert details
  useEffect(() => {
    const fetchAlertDetails = async () => {
      try {
        const token = user?.token; // Retrieve the token from context
        if (!token) {
          throw new Error('User is not authenticated');
        }

        const response = await fetch(`http://localhost:3000/api/alerts/${alertId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch alert details');
        }

        // console.log('Fetched Alert Details:', data); // Debug log
        setAlertDetails(data);
        setAlertDetailsLoaded(true); // Mark alert details as loaded

        // Request the latest responder location after alert details are fetched
        if (data.responderId) {
          console.log(`Requesting latest location for responderId: ${data.responderId}`);
          socket.emit('requestResponderLocation', data.responderId);
          console.log("Responder ID in alert details:", data.responderId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertDetails();
  }, [alertId, user]);

  // Listen for real-time responder location updates
  useEffect(() => {
    if (alertDetails?.responderId) {
      console.log('Listening for location updates for responderId:', alertDetails.responderId);
      const handleLocationUpdate = (location) => {
        console.log('Received responder location update in ReportDetails:', location);
        setResponderLocation(location);
      };
      socket.on(`locationUpdate:${alertDetails.responderId}`, handleLocationUpdate);

      return () => {
        socket.off(`locationUpdate:${alertDetails.responderId}`, handleLocationUpdate);
      };
    }
  }, [alertDetails?.responderId]);

  // Calculate distance between responder and alert location
  useEffect(() => {
    if (responderLocation?.latitude && responderLocation?.longitude && alertDetails?.latitude && alertDetails?.longitude) {
      console.log('Responder Location:', responderLocation);
      console.log('Emergency Location:', {
        latitude: alertDetails.latitude,
        longitude: alertDetails.longitude,
      });

      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const toRadians = (degrees) => (degrees * Math.PI) / 180;
        const R = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        console.log('Calculated Distance:', distance);
        return distance;
      };

      const dist = calculateDistance(
        responderLocation.latitude,
        responderLocation.longitude,
        alertDetails.latitude,
        alertDetails.longitude
      );

      console.log('Setting Distance State:', dist);
      setDistance(dist.toFixed(2));
      console.log('Updated Distance State:', dist.toFixed(2)); // Debug log
    } else {
      // console.log('Missing data for distance calculation:', {
      //   responderLocation,
      //   emergencyLatitude: alertDetails?.latitude,
      //   emergencyLongitude: alertDetails?.longitude,
      // });
      // Optionally reset distance if data is missing
      setDistance(null);
    }
  }, [responderLocation, alertDetails?.latitude, alertDetails?.longitude]);

  // console.log('Distance to Display:', distance);
  // console.log('Rendering ReportDetails Component with Distance:', distance);

  const handleRespond = async () => {
    try {
      const token = user?.token; // Retrieve the token from context
      if (!token) {
        throw new Error('User is not authenticated');
      }

      const response = await fetch(`http://localhost:3000/api/alerts/${alertId}/respond`, {
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

      // Show the modal with a success message
      setModalMessage('You are now responding to this alert.');
      setShowModal(true);

      // Update the notification in the Navbar
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.alertId === alertId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error responding to alert:', err);
      setModalMessage(`Error: ${err.message}`);
      setShowModal(true); // Show the modal with an error message
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/ResponderDashboard'); // Redirect to the ResponderDashboard after closing the modal
  };

  const getOptimizedImageUrl = (imageURL) => {
    if (!imageURL) return '';
    // Add Cloudinary transformations to the URL
    return imageURL.replace('/upload/', '/upload/q_auto,f_auto,w_auto,dpr_auto/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Example usage of alertDetailsLoaded
  if (!alertDetailsLoaded) {
    return <div>Loading alert details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="report-details-container">
      <h1 className="report-title">Report Details</h1>
      <div className="report-content">
        <p><strong>Emergency Type:</strong> {alertDetails?.category || 'N/A'}</p>
        <p><strong>Message:</strong> {alertDetails?.message}</p>
        <p><strong>Location:</strong> {alertDetails?.location}</p>
        <p><strong>Contact Number:</strong> {alertDetails?.contactNumber}</p>
        <p><strong>Submitted By:</strong> {alertDetails?.userId?.userName}</p>
        <p><strong>Agency:</strong> {alertDetails?.agencyId?.name}</p>
        {distance && <p><strong>Distance:</strong> {distance} km away</p>}
        <p><strong>Status:</strong> {alertDetails?.status}</p>
        {alertDetails?.imageURL && (
          <div className="report-image-container">
            <img
              src={getOptimizedImageUrl(alertDetails.imageURL)}
              alt="Report"
              className="report-image"
              loading="lazy"
            />
          </div>
        )}
        {/* Display the responder's real-time location on a map */}
        {responderLocation?.latitude && responderLocation?.longitude && (
          <div className="map-container">
            <h3>Responder's Real-Time Location</h3>
            <Map latitude={responderLocation.latitude} longitude={responderLocation.longitude} />
          </div>
        )}
        {/* Display the user's location on a map */}
        {alertDetails?.latitude && alertDetails?.longitude && (
          <div className="map-container">
            <h3>Emergency Location on Map</h3>
            <Map latitude={alertDetails.latitude} longitude={alertDetails.longitude} />
          </div>
        )}
      </div>
      {/* Show the Respond button only for responders and when the status is pending */}
      {user?.role === 'responder' && alertDetails?.status === 'pending' && (
        <button
          onClick={handleRespond}
          className="respond-button"
        >
          Respond
        </button>
      )}
      {showModal && <Modal message={modalMessage} onClose={handleCloseModal} />}
    </div>
  );
};

export default ReportDetails;