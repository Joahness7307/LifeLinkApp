import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import useFetchUser from '../hooks/useFetchUser';
import '../styles/Profile.css';
import profileImage from '../assets/profileImage.jpg'; // Import your image
import Map from '../components/Map';

const Profile = () => {
  const { user } = useAuthContext();
  const { user: userDetails, error } = useFetchUser(user?._id);

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
              <p>{userDetails.phoneNumber}</p>
            </div>
            <div className="profile-field">
              <label>Address:</label>
              <p>
                {`${userDetails.address.barangay}, ${userDetails.address.city}, ${userDetails.address.province}, ${userDetails.address.region}, ${userDetails.address.country}`}
              </p>
            </div>
            <div className="profile-field">
              <label>Latitude:</label>
              <p>{userDetails.latitude}</p>
            </div>
            <div className="profile-field">
              <label>Longitude:</label>
              <p>{userDetails.longitude}</p>
            </div>
          </div>
        )}
        {userDetails.latitude && userDetails.longitude && (
          <Map latitude={userDetails.latitude} longitude={userDetails.longitude} />
        )}
      </div>
    </div>
  );
};

export default Profile;
