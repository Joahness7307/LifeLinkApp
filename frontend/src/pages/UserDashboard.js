import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFetchEmergencies from '../hooks/useFetchEmergencies';
import useAuthContext from '../hooks/useAuthContext';
import useNotifications from '../hooks/useNotification';
import emergencyIcons from '../icons/emergencyIcons';
import '../styles/EmergencyList.css';

const UserDashboard = () => {
  const { emergencies, error } = useFetchEmergencies();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const userId = localStorage.getItem('userId'); // Replace with actual user ID retrieval logic
  useNotifications(userId);

  // Verify user role
  if (user?.role !== 'user') {
    navigate('/unauthorized');
    return null;
  }

  const handleEmergencyClick = (emergency) => {
    if (!user) {
      alert('You need to be logged in to report an emergency.');
      return;
    }

    navigate('/SubmitReport', {
      state: { 
        emergencyId: emergency._id,
        emergencyType: emergency.type,
        userId: user._id 
      }
    });
  };

  return (
    <div className="emergency-list-container">
      <h2>Report an Emergency</h2>
      {error && <p className="error">{error}</p>}
      <ul className="emergency-list">
        {emergencies.map((emergency) => (
          <li key={emergency._id} onClick={() => handleEmergencyClick(emergency)}>
            <div>
              <img src={emergencyIcons[emergency.type]} alt={emergency.type} className="emergency-icon" />
              <div>{emergency.type}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserDashboard;