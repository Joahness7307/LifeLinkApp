import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import useFetchUser from '../hooks/useFetchUser';
import '../styles/Profile.css';
import profileImage from '../assets/profileImage.jpg'; // Import your image

const Profile = () => {
  const { user } = useAuthContext();
  const { user: userDetails, error } = useFetchUser(user?.id || localStorage.getItem('userId'));

  // console.log('AuthContext user:', user);
  // console.log('Fetched user details:', userDetails);

  if (!userDetails) {
    return <div>Loading...</div>; // Show a loading message while userDetails is being fetched
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
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
              <p>{userDetails.contactNumber}</p>
            </div>
            <div className="profile-field">
              <label>Address:</label>
              <p>
                {`${userDetails.address.barangay}, ${userDetails.address.city}, ${userDetails.address.province}, ${userDetails.address.region}, ${userDetails.address.country}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
