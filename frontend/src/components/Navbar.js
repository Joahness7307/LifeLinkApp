import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useLogout } from '../hooks/useLogout';
import useAuthContext from '../hooks/useAuthContext';
import appLogo from '../assets/appLogo.png';
import searchIcon from '../assets/searchIcon.png';
import '../styles/Navbar.css';

const Navbar = ({ notifications = [], setNotifications }) => {
  const { logout } = useLogout();
  const { user, authIsReady } = useAuthContext();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // console.log('Auth is ready:', authIsReady); // Debugging log
  // console.log('User:', user); // Debugging log
  // console.log('Navbar user:', user);

  useEffect(() => {
  if (user && user.isProfileComplete) { // Only fetch notifications if the profile is complete
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/notifications', {
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

    const socket = io('http://localhost:3000', { withCredentials: true });
    socket.emit('join', user._id);
    socket.on('notification', (notification) => {
      console.log('New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
    });
    

    return () => {
      socket.disconnect();
    };
  }
}, [user, setNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
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
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  // Wait for authIsReady before rendering the Navbar
  if (!authIsReady) {
    return null; // Or a loading spinner if desired
  }

  // Restricted Navbar for users with incomplete profiles
  if (user && !user.isProfileComplete) {
    return (
      <nav className="navbar">
        <div className="navbar-left">
          <img src={appLogo} alt="App Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-right">
          <button className="nav-link" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    );
  }

  // Full Navbar for fully authenticated users
  return (
    <nav className="navbar">
      {user ? (
        <>
          <div className="burger-menu-icon" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? '✖' : '☰'}
          </div>
          {isMobileMenuOpen && (
            <div className="mobile-menu authenticated-mobile-menu">
              <Link to="/UserDashboard" onClick={toggleMobileMenu}>
                Home
              </Link>
              <Link to="/profile" onClick={toggleMobileMenu}>
                Profile
              </Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}

          <div className="navbar-left">
            <Link to="/UserDashboard" className="nav-link">
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

          <div className="navbar-center">
            <Link to="/UserDashboard">
              <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
            </Link>
          </div>

          <div className="navbar-right">
            <div className="search-icon-mobile">
              <button className="search-icon-button" onClick={handleSearch}>
                <img src={searchIcon} alt="Search" className="search-icon" />
              </button>
            </div>
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
                          navigate(`/reports/${notif.alertId?._id}`);
                        }}
                      >
                        <p>{notif.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="notification-item">No new notifications</div>
                  )}
                </div>
              )}
            </div>

            <div className="user-dropdown">
              <button
                className="welcome-user"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                 Welcome, {user?.userName || 'Guest'} ▼
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
          <div className="navbar-right-unauthenticated">
            <Link to="/login" className="navbar-link">Sign In</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </div>
          <div className="burger-menu-icon2" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? '✖' : '☰'}
          </div>
          {isMobileMenuOpen && (
            <div className="mobile-menu">
              <Link to="/login" onClick={toggleMobileMenu}>Sign In</Link>
              <Link to="/signup" onClick={toggleMobileMenu}>Sign Up</Link>
            </div>
          )}
        </>
      )}
    </nav>
  );
};

export default Navbar;