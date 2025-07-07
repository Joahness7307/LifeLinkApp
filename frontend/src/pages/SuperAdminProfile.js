import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import useFetchUser from '../hooks/useFetchUser';
import '../styles/Profile.css';

const SuperAdminProfile = () => {
  const { user } = useAuthContext();
  const { user: userDetails, error } = useFetchUser(user?.id);

  if (!userDetails) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h2>Super Admin Profile</h2>
      <div className="profile-card">
        {error && <p className="error">{error}</p>}
        <div className="profile-details">
          <div className="profile-field">
            <label>Username: </label>
            <p>{userDetails.userName}</p>
          </div>
          <div className="profile-field">
            <label>Email: </label>
            <p>{userDetails.email}</p>
          </div>
          <div className="profile-field">
            <label>Contact Number: </label>
            <p>{userDetails.contactNumber || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;