import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import useAuthContext from '../hooks/useAuthContext';
import appLogo from '../assets/appLogo.png';
import searchIcon from '../assets/searchIcon.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  // Dummy notifications - replace with real notifications from your backend
  const notifications = [
    { id: 1, message: "New emergency alert in your area" },
    { id: 2, message: "Your report has been processed" },
    // Add more notifications as needed
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <nav className="navbar">
      {user ? (
        <>
          {/* Left Section */}
          <div className="navbar-left">
            {/* Dynamically adjust the Home link based on the user's role */}
            {/* <Link
              to={user.role === 'responder' ? '/ResponderDashboard' : '/emergencies'}
              className="nav-link"
            >
              Home
            </Link> */}
            <form onSubmit={handleSearch} className="search-form">
              <img src={searchIcon} alt="Search" className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>
          </div>

          {/* Center Section */}
          <div className="navbar-center">
            <Link
              to={user.role === 'responder' ? '/ResponderDashboard' : '/emergencies'}
            >
              <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
            </Link>
          </div>

          {/* Right Section */}
          <div className="navbar-right">
            {/* Notifications Dropdown */}
            <div className="notifications-dropdown">
              <button
                className="notifications-button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-menu">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="notification-item">
                        {notif.message}
                      </div>
                    ))
                  ) : (
                    <div className="notification-item">No new notifications</div>
                  )}
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="user-dropdown">
              <button
                className="welcome-user"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                Welcome, {user.userName} ▼
              </button>

              {showUserMenu && (
                <div className="user-menu">
                  <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="navbar-logo">
            <Link to="/">
              <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/signup" className="navbar-linkS">Sign Up</Link>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;