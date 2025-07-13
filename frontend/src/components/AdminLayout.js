// src/components/AdminLayout.js
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../styles/DepartmentAdminDashboard.css'; // For dashboard specific styles
import '../component-styles/AdminLayout.css'; // For AdminLayout specific styles

const AdminLayout = ({ children, newReportsCount, onSidebarNavigate, selectedStatus }) => {
  // Determine if it's a "large screen" where the sidebar should be visible
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(window.innerWidth > 900);

  useEffect(() => {
    const handleResize = () => {
      setShowDesktopSidebar(window.innerWidth > 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-layout">
      {/* Conditionally render the Sidebar component */}
      {showDesktopSidebar && (
        <Sidebar newReportsCount={newReportsCount} onNavigate={onSidebarNavigate}  selectedStatus={selectedStatus}/>
      )}

      {/* Main content area: its margin depends on whether the desktop sidebar is shown */}
      <main className={`dashboard-main ${showDesktopSidebar ? '' : 'no-sidebar-margin'}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;