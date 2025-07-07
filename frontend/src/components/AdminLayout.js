import React from 'react';
import Sidebar from './Sidebar';
import '../styles/DepartmentAdminDashboard.css';

const AdminLayout = ({ children, newReportsCount, onSidebarNavigate }) => (
  <div className="dashboard-layout">
    <Sidebar newReportsCount={newReportsCount} onNavigate={onSidebarNavigate} />
    <main className="dashboard-main">{children}</main>
  </div>
);

export default AdminLayout;