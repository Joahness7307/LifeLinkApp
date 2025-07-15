import React from 'react';
import useAuthContext from '../hooks/useAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import '../component-styles/Sidebar.css';

const Sidebar = ({ newReportsCount, onNavigate, selectedStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { logout } = useLogout();

  const handleInternalNavigate = (type) => {
    onNavigate(type);
  };

  const handleDashboardClick = () => {
    if (!user) return;
    if (user.role === 'superAdmin') navigate('/SuperAdminDashboard');
    else if (user.role === 'regionAdmin') navigate('/RegionAdminDashboard');
    else if (user.role === 'provinceAdmin') navigate('/ProvinceAdminDashboard');
    else if (user.role === 'cityAdmin') navigate('/CityAdminDashboard');
    else if (user.role === 'departmentAdmin') navigate('/DepartmentAdminDashboard');
    else if (user.role === 'responder') navigate('/ResponderDashboard');
    else navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddResponderClick = () => {
    navigate('/AddResponder');
  };

  const isDepartmentAdminPage =
    user?.role === 'departmentAdmin' &&
    (
      location.pathname.startsWith('/DepartmentAdminDashboard') ||
      location.pathname.startsWith('/DepartmentAdminProfile') ||
      location.pathname.startsWith('/ReportDetails') ||
      location.pathname.startsWith('/AddResponder')
    );

  // Determine which button is selected
 const selected = (btn) => {
  if (btn === 'dashboard') {
    // Only selected if on dashboard root and not viewing pending reports
    return location.pathname === '/DepartmentAdminDashboard' && selectedStatus !== 'pending';
  }
  if (btn === 'new-reports') {
    // Selected if on dashboard and viewing pending reports
    return location.pathname === '/DepartmentAdminDashboard' && selectedStatus === 'pending';
  }
  if (btn === 'add-responder') return location.pathname.startsWith('/AddResponder');
  if (btn === 'profile') return location.pathname.startsWith('/DepartmentAdminProfile');
  return false;
};

  return (
    <div className="sidebar">
      <button
        className={`sidebar-link${selected('dashboard') ? ' selected' : ''}`}
        onClick={handleDashboardClick}
      >
        Dashboard
      </button>
      {isDepartmentAdminPage && (
        <>
          <button
            className={`sidebar-links${selected('new-reports') ? ' selected' : ''}`}
            onClick={() => handleInternalNavigate('new-reports')}
          >
            New Reports {newReportsCount > 0 && <span className="badge">{newReportsCount}</span>}
          </button>
          <button
            className={`sidebar-links${selected('add-responder') ? ' selected' : ''}`}
            onClick={handleAddResponderClick}
          >
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