import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useFetchEmergencies from '../hooks/useFetchEmergencies';
import { AuthContext } from '../context/AuthContext'; // Import the AuthContext
import emergencyIcons from '../icons/emergencyIcons';
import '../styles/EmergencyList.css';

const EmergencyList = () => {
  const { emergencies, error } = useFetchEmergencies();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get the user data from AuthContext

  const handleEmergencyClick = (emergency) => {
    if (!user) {
      alert('You need to be logged in to report an emergency.');
      return;
    }

    if (!user._id) {
      console.error("user._id is undefined");
      console.log('userId:', user._id);
      return;
    }

    navigate('/SubmitReport', {
      state: { emergencyId: emergency._id, emergencyType: emergency.type, userId: user._id },
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

export default EmergencyList;