import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Unauthorized.css'; // Optional: Add styles for this page

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/" className="back-home-link">Go Back to Home</Link>
    </div>
  );
};

export default Unauthorized;