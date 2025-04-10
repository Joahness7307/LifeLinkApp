import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // Import Socket.IO client
import { useLogout } from '../hooks/useLogout';
import useAuthContext from '../hooks/useAuthContext';
import appLogo from '../assets/appLogo.png';
import searchIcon from '../assets/searchIcon.png';
import '../styles/Navbar.css';

const Navbar = ({ notifications = [], setNotifications }) => { // Default notifications to an empty array
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const response = await fetch('http://localhost:3001/notifications', {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const json = await response.json();
          if (response.ok) {
            setNotifications(json);
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        }
      };

      fetchNotifications();

      // Connect to the Socket.IO server
      const socket = io('http://localhost:3000', {
        withCredentials: true, // Include credentials (cookies, headers)
      });

      // Join the user's room
      socket.emit('join', user._id);

      // Listen for new notifications
      socket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        setNotifications((prevNotifications) => [notification, ...prevNotifications]);
      });

      // Cleanup on component unmount
      return () => {
        socket.disconnect();
      };
    }
  }, [user, setNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3001/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <nav className="navbar">
      {user ? (
        <>
          {/* Left Section */}
          <div className="navbar-left">
            <Link
              to={user.role === 'responder' ? '/ResponderDashboard' : '/UserDashboard'}
              className="nav-link"
            >
              Home
            </Link>
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
              to={user.role === 'responder' ? '/ResponderDashboard' : '/UserDashboard'}
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
                {notifications.some((n) => !n.isRead) && (
                  <span className="notification-badge">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-menu">
                 {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                      onClick={() => {
                        markAsRead(notif._id);
                        // Redirect to the appropriate page based on the role
                        if (user.role === 'responder') {
                          navigate(`/reports/${notif.alertId?._id}`); // Redirect to report details for responders
                        } else if (user.role === 'user') {
                          navigate(`/reports/${notif.alertId?._id}`); // Redirect to report details for normal users
                        }
                      }}
                    >
                      <p>
                        {user.role === 'responder'
                          ? notif.message // Use the message for responders
                          : notif.message} {/* Use the message for normal users */}
                      </p>
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
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;