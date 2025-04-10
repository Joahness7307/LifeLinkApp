import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import useFetchUser from '../hooks/useFetchUser';
import '../styles/Profile.css';
import profileImage from '../assets/profileImage.jpg'; // Import your image

const Profile = () => {
  const { user } = useAuthContext();
  const { user: userDetails, error } = useFetchUser(user?._id);

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Add the image above the heading */}
        <img src={profileImage} alt="Profile" className="profile-image" />
        <h2>User Profile</h2>
        {error && <p className="error">{error}</p>}
        {userDetails && (
          <div className="profile-details">
            <div className="profile-field">
              <label>Username:</label>
              <p>{userDetails.userName}</p>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <p>{userDetails.email}</p>
            </div>
            <div className="profile-field">
              <label>Phone Number:</label>
              <p>{userDetails.phoneNumber}</p>
            </div>
            <div className="profile-field">
              <label>Address:</label>
              <p>{userDetails.address}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
