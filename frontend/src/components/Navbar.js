import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import appLogo from '../assets/appLogo.png';
import '../styles/Navbar.css';

const Navbar = ({ notifications = [], setNotifications }) => {
  const { user, authIsReady } = useAuthContext(); 
  const navigate = useNavigate();
  const location = useLocation();

  // Page groups for navbar logic
  const unauthPaths = [
    '/', '/login', '/signup', '/forgot-password', '/setup-account'
  ];
  const isUnauthPage = unauthPaths.some(path => location.pathname === path || location.pathname.startsWith('/reset-password'));
  // const isCompleteProfilePage = location.pathname === '/complete-profile';

  // Wait for auth context to be ready
  if (!authIsReady) {
    return (
      <nav className="navbar">
        <div>Loading...</div>
      </nav>
    );
  }

  // 1. Unauthenticated Navbar
  if (isUnauthPage) {
    return (
      <nav className="navbar">
        <div className="navbar-logo">
        <Link to="/">
          <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
        </Link>
        </div>
        <div className="navbar-right-unauthenticated">
          <Link to="/login" className="nav-link">Log In</Link>
          {/* <Link to="/signup" className="nav-link">Sign Up</Link> */}
        </div>
      </nav>
    );
  }

  // // 2. Incomplete Profile Navbar (Google login, Complete Profile) - only for publicUser
  // if (isCompleteProfilePage && user && user.role === 'publicUser' && !user.isProfileComplete) {
  //   return (
  //     <nav className="navbar">
  //       <div className="navbar-logo">
  //       <Link to="/">
  //         <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
  //       </Link>
  //       </div>
  //       <div className="navbar-right-unauthenticated">
  //         <button className="navbar-link" onClick={handleLogout}>Logout</button>
  //       </div>
  //     </nav>
  //   );
  // }

  // 3. Authenticated and Profile Complete Navbar (or any admin role)
  if (
    user &&
    (
      user.role !== 'publicUser' ||
      (user.role === 'publicUser' && user.isProfileComplete)
    )
  ) {
    // Determine dashboard route based on role
    let dashboardRoute = '/PublicUserDashboard';
    if (user.role === 'superAdmin') dashboardRoute = '/SuperAdminDashboard';
    else if (user.role === 'regionAdmin') dashboardRoute = '/RegionAdminDashboard';
    else if (user.role === 'provinceAdmin') dashboardRoute = '/ProvinceAdminDashboard';
    else if (user.role === 'cityAdmin') dashboardRoute = '/CityAdminDashboard';
    else if (user.role === 'departmentAdmin') dashboardRoute = '/DepartmentAdminDashboard';

    // Determine profile route based on role
    let profileRoute = '/PublicUserProfile';
    if (user.role === 'regionAdmin') profileRoute = '/RegionAdminProfile';
    else if (user.role === 'provinceAdmin') profileRoute = '/ProvinceAdminProfile';
    else if (user.role === 'cityAdmin') profileRoute = '/CityAdminProfile';
    else if (user.role === 'departmentAdmin') profileRoute = '/DepartmentAdminProfile';
    else if (user.role === 'superAdmin') profileRoute = '/SuperAdminProfile';


    return (
      <nav className="navbar">
        <div className="navbar-left">
          <Link to={dashboardRoute}>
            <img src={appLogo} alt="LifeLink Logo" className="navbar-logo-img" />
          </Link>
        </div>
        <div className="navbar-right">
          <button
            className="my-account-btn"
            onClick={() => navigate(profileRoute)}
          >
            My Account
          </button>
        </div>
      </nav>
    );
  }

  // Fallback (should not be reached)
  return null;
};

export default Navbar;