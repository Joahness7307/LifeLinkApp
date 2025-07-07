import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout'; // Import your logout hook
import '../component-styles/Sidebar.css';

const Sidebar = ({ newReportsCount, onNavigate }) => {
  const navigate = useNavigate();
  const  location = window.location; // Get current location for conditional rendering
  const { user } = useAuthContext(); // Get user from context
  const { logout } = useLogout();

  const handleDashboardClick = () => {
    if (!user) return;
    if (user.role === 'superAdmin') navigate('/SuperAdminDashboard');
    else if (user.role === 'regionAdmin') navigate('/RegionAdminDashboard');
    else if (user.role === 'provinceAdmin') navigate('/ProvinceAdminDashboard');
    else if (user.role === 'cityAdmin') navigate('/CityAdminDashboard');
    else if (user.role === 'departmentAdmin') navigate('/DepartmentAdminDashboard');
    else if (user.role === 'responder') navigate('/ResponderDashboard');
    else navigate('/'); // Fallback to home if role is not recognized
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Only show these for department admin dashboard/profile/report details
  const isDepartmentAdminPage =
    user?.role === 'departmentAdmin' &&
    (
      location.pathname.startsWith('/DepartmentAdminDashboard') ||
      location.pathname.startsWith('/DepartmentAdminProfile') ||
      location.pathname.startsWith('/ReportDetails') ||
      location.pathname.startsWith('/AddResponder')
    );

  return (
    <div className="sidebar">
      <button className="sidebar-link" onClick={handleDashboardClick}>
        Dashboard
      </button>
      {isDepartmentAdminPage && (
        <>
          <button className="sidebar-links" onClick={() => onNavigate('new-reports')}>
            New Reports {newReportsCount > 0 && <span className="badge">{newReportsCount}</span>}
          </button>
          <button className="sidebar-links" onClick={() => navigate('/AddResponder')}>
            Add Responder
          </button>
        </>
      )}
      <button className="sidebar-links" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Sidebar;