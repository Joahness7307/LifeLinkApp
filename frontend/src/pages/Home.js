import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/GeneralStyles.css';
import '../styles/Home.css';
import appLogo from '../assets/appLogo.png';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>
          Welcome to <img src={appLogo} alt="LifeLink Logo" className="home-logo-inline" />
        </h1>
        <p>Your safety is our priority.</p>
        <Link to="/login" className="get-started-button">Get Started</Link>
      </div>
    </div>
  );
}

export default Home;