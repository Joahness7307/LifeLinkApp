import React, { useState } from 'react';
import useAuthContext from '../hooks/useAuthContext';
import useFetchUser from '../hooks/useFetchUser';
import '../styles/Profile.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CityAdminProfile = () => {
  const { user } = useAuthContext();
  const { user: userDetails, error } = useFetchUser(user?.id);

  // Add state for editing
  const [editMode, setEditMode] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [saving, setSaving] = useState(false);

  if (!userDetails) return <div>Loading...</div>;

  const handleSave = async () => {
    if (!/^09\d{9}$|^0\d{9,10}$/.test(contactNumber)) {
      alert('Invalid Philippine contact number');
      return;
    }
    setSaving(true);
    const res = await fetch(`${BACKEND_URL}/api/user/${userDetails._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ contactNumber }),
    });
    if (res.ok) {
      setEditMode(false);
      window.location.reload();
    } else {
      alert('Failed to update contact number');
    }
    setSaving(false);
  };

  // Get assigned region, province, and city names (if populated, else show ID)
  const regionName =
    userDetails.address &&
    userDetails.address.region &&
    (userDetails.address.region.name || userDetails.address.region);

  const provinceName =
    userDetails.address &&
    userDetails.address.province &&
    (userDetails.address.province.name || userDetails.address.province);

  const cityName =
    userDetails.address &&
    userDetails.address.city &&
    (userDetails.address.city.name || userDetails.address.city);

  return (
    <div className="profile-container">
      <h2>City Admin Profile</h2>
      <div className="profile-card">
        {error && <p className="error">{error}</p>}
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
            <label>Contact Number:</label>
            {editMode ? (
              <>
                <input
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="09XXXXXXXXX or 0XXXXXXXXX"
                />
                <button onClick={handleSave} disabled={saving}>Save</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
              </>
            ) : (
              <>
                <p>{userDetails.contactNumber || 'N/A'}</p>
                <button onClick={() => {
                  setContactNumber(userDetails.contactNumber || '');
                  setEditMode(true);
                }}>Edit</button>
              </>
            )}
          </div>
          <div className="profile-field">
            <label>Assigned Region:</label>
            <p>{regionName}</p>
          </div>
          <div className="profile-field">
            <label>Assigned Province:</label>
            <p>{provinceName}</p>
          </div>
          <div className="profile-field">
            <label>Assigned City/Municipality:</label>
            <p>{cityName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityAdminProfile;