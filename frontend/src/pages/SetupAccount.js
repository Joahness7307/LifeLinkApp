import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SetupAccount.css'; // Adjust the path as necessary

const SetupAccount = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isValidPHNumber = (number) => {
    // Mobile: 09XXXXXXXXX or Landline: 0XXXXXXXXX (9-11 digits)
    return /^09\d{9}$|^0\d{9,10}$/.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token'); // Get the token from the URL

    // Validate contact number before submitting
    if (!isValidPHNumber(contactNumber)) {
      setError('Please enter a valid Philippine mobile or landline number.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/admin/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userName, password, contactNumber }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Account setup successfully!');
        navigate('/login'); // Redirect to login page
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error setting up account:', error);
      setError('Failed to set up account.');
    }
  };

  return (
    <div className="setup-account-bg">
      <div className="setup-account">
        <h1>Set Up Your Account</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
          <button type="submit">Set Up Account</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default SetupAccount;