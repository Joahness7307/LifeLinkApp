// src/components/Navbar.js
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import useAuthContext from '../hooks/useAuthContext';
import { useLogout } from '../hooks/useLogout'; // Import useLogout for the mobile menu
import appLogo from '../assets/appLogo.png';
import '../styles/Navbar.css';

const Navbar = ({ notifications = [], setNotifications, newReportsCount, onSidebarNavigate }) => {
  const { user, authIsReady } = useAuthContext();
  const { logout } = useLogout(); // Initialize logout hook
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // Controls if menu is in DOM
  const [menuState, setMenuState] = useState(''); // 'open', 'closing', ''
  const mobileMenuRef = useRef(null);

  // Determine if it's a mobile/tablet view (for showing burger icon vs desktop links)
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuState === 'open' &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('.burger-menu-icon') // Don't close if click is on the burger icon itself
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuState]);

  useEffect(() => {
    // Add/remove class to body to disable scrolling when mobile menu is open
    document.body.classList.toggle('menu-open', isMobileMenuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [isMobileMenuOpen]);

 const selected = (btn) => {
  if (btn === 'dashboard') {
    // Only selected if on dashboard root and not viewing pending reports
    return location.pathname === '/DepartmentAdminDashboard' && location.state?.selectedStatus !== 'pending';
  }
  if (btn === 'new-reports') {
    // Selected if on dashboard and viewing pending reports
    return location.pathname === '/DepartmentAdminDashboard' && location.state?.selectedStatus === 'pending';
  }
  if (btn === 'add-responder') return location.pathname.startsWith('/AddResponder');
  if (btn === 'profile') return location.pathname.startsWith('/DepartmentAdminProfile');
  return false;
};


  // const unauthPaths = ['/', '/login', '/signup', '/forgot-password', '/setup-account'];
  // const isUnauthPage = unauthPaths.some(
  //   (path) => location.pathname === path || location.pathname.startsWith('/reset-password')
  // );

  if (!authIsReady) {
    return (
      <nav className="navbar">
        <div>Loading...</div>
      </nav>
    );
  }

  const openMenu = () => {
    setMobileMenuOpen(true);
    setTimeout(() => {
      setMenuState('open');
    }, 10);
  };

  const closeMenu = () => {
    setMenuState('closing');
    setTimeout(() => {
      setMobileMenuOpen(false);
      setMenuState('');
    }, 300); // Match transition time in CSS
  };

  const handleMobileNavLinkClick = (path, action = null) => {
    closeMenu(); // Always close menu on link click
    if (action === 'logout') {
      logout();
      navigate('/login');
    } else if (action === 'department_navigate' && onSidebarNavigate) {
      onSidebarNavigate(path); // Call the specific department nav handler
    } else {
      navigate(path);
    }
  };

  // Common dashboard route logic
  let dashboardRoute = '/'; // Default for public or unhandled roles
  let profileRoute = '/';
  if (user) {
    if (user.role === 'superAdmin') {
      dashboardRoute = '/SuperAdminDashboard';
      profileRoute = '/SuperAdminProfile';
    } else if (user.role === 'regionAdmin') {
      dashboardRoute = '/RegionAdminDashboard';
      profileRoute = '/RegionAdminProfile';
    } else if (user.role === 'provinceAdmin') {
      dashboardRoute = '/ProvinceAdminDashboard';
      profileRoute = '/ProvinceAdminProfile';
    } else if (user.role === 'cityAdmin') {
      dashboardRoute = '/CityAdminDashboard';
      profileRoute = '/CityAdminProfile';
    } else if (user.role === 'departmentAdmin') {
      dashboardRoute = '/DepartmentAdminDashboard';
      profileRoute = '/DepartmentAdminProfile';
    } else if (user.role === 'responder') {
        dashboardRoute = '/ResponderDashboard';
        profileRoute = '/ResponderProfile'; // Assuming you have a ResponderProfile
    }
  }

  // Determine if Department Admin specific links should show in mobile menu
  const isDepartmentAdminPageInMobileMenu =
    user?.role === 'departmentAdmin' &&
    (
      location.pathname.startsWith('/DepartmentAdminDashboard') ||
      location.pathname.startsWith('/DepartmentAdminProfile') ||
      location.pathname.startsWith('/ReportDetails') ||
      location.pathname.startsWith('/AddResponder') // Also check for AddResponder
    );

  const renderMobileMenuContent = () => {
    // Content for authenticated users
    if (user) {
      return (
        <>
          <Link to={dashboardRoute}
          className={selected('dashboard') ? 'selected' : ''}
          onClick={() => handleMobileNavLinkClick(dashboardRoute)}>
            Dashboard
          </Link>
          {isDepartmentAdminPageInMobileMenu && (
            <>
              <button
                className={`mobile-menu-button${selected('new-reports') ? ' selected' : ''}`}
                onClick={() => handleMobileNavLinkClick('new-reports', 'department_navigate')}
              >
                New Reports {newReportsCount > 0 && <span className="badge">{newReportsCount}</span>}
              </button>
              <button
                className={`mobile-menu-button${selected('add-responder') ? ' selected' : ''}`}
                onClick={() => handleMobileNavLinkClick('/AddResponder')}
              >
                Add Responder
              </button>
            </>
          )}
          {/* Always show "My Account" and "Logout" in authenticated mobile menu */}
          <Link to={profileRoute} onClick={() => handleMobileNavLinkClick(profileRoute)}
          className={selected('profile') ? 'selected' : ''}>
            My Account
          </Link>
          <button className="mobile-menu-button" onClick={() => handleMobileNavLinkClick('/login', 'logout')}>
            Logout
          </button>
        </>
      );
    }
    // Content for unauthenticated users
    return (
      <Link
        to="/login"
        onClick={() => handleMobileNavLinkClick('/login')}
        className={location.pathname === '/login' ? 'selected' : ''}
      >
        Login
      </Link>
    );
  };


  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={dashboardRoute}> {/* Use dashboardRoute for logo link */}
          <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
        </Link>
      </div>

      <div className="burger-menu-wrapper">
        {/* Conditional rendering for icons: show burger if menu isn't open, show X if it is */}
        {!isMobileMenuOpen ? (
          <button className="burger-menu-icon" onClick={openMenu} aria-label="Open menu">☰</button>
        ) : (
          <button className="burger-menu-icon" onClick={closeMenu} aria-label="Close menu">✖</button>
        )}
      </div>

      {/* Desktop links/buttons */}
      {!isSmallScreen && (
        <>
          {user ? (
            <div className="navbar-right">
              <button
                className="my-account-btn"
                onClick={() => navigate(profileRoute)}
              >
                My Account
              </button>
            </div>
          ) : (
            <div className="navbar-right-unauthenticated">
              <Link to="/login" className="nav-link">Login</Link>
            </div>
          )}
        </>
      )}

      {/* Mobile Menu */}
      {(isMobileMenuOpen || menuState === 'closing') && (
        <div
          ref={mobileMenuRef}
          className={`mobile-menu ${menuState}`}
        >
          {renderMobileMenuContent()}
        </div>
      )}
    </nav>
  );
};

export default Navbar;