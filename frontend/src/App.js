// src/App.js
import React, { useState } from 'react';
import { Routes, Route, useNavigate} from 'react-router-dom';
import Navbar from './components/Navbar'; // Your Navbar component
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
// import ResponderDashboard from './pages/ResponderDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleAuthHandler from './pages/GoogleAuthHandler';
import './styles/index.css'; // Your global styles
import SetupAccount from './pages/SetupAccount';
import ProvinceAdminDashboard from './pages/ProvinceAdminDashboard';
import CityAdminDashboard from './pages/CityAdminDashboard';
import RegionAdminDashboard from './pages/RegionAdminDashboard';
import RegionAdminProfile from './pages/RegionAdminProfile';
import ProvinceAdminProfile from './pages/ProvinceAdminProfile';
import CityAdminProfile from './pages/CityAdminProfile';
import DepartmentAdminDashboard from './pages/DepartmentAdminDashboard';
import DepartmentAdminProfile from './pages/DepartmentAdminProfile';
import AddResponderPage from './pages/AddResponder';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminProfile from './pages/SuperAdminProfile';
import ReportDetails from './pages/ReportDetails';
import AdminLayout from './components/AdminLayout'; // Your AdminLayout component

function App() {
  const [notifications, setNotifications] = useState([]);
  const [newReportsCount, setNewReportsCount] = useState(0);

  const navigate = useNavigate(); // Initialize useNavigate here

    const handleDepartmentSidebarNavigation = (type) => {
  if (type === 'new-reports') {
    if (window.location.pathname === '/DepartmentAdminDashboard') {
      // Fire a custom event for the dashboard to listen to
      window.dispatchEvent(new Event('select-pending-reports'));
      setTimeout(() => {
        const section = document.getElementById('pending-reports-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate('/DepartmentAdminDashboard', { state: { scrollToPending: true } });
    }
  }
};

  return (
    <div className="App">
      {/* Pass newReportsCount and onSidebarNavigate to Navbar */}
      <Navbar
        notifications={notifications}
        setNotifications={setNotifications}
        newReportsCount={newReportsCount}
        onSidebarNavigate={handleDepartmentSidebarNavigation}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Routes wrapped in AdminLayout now receive newReportsCount and onSidebarNavigate */}
        {/* <Route
          path="/ResponderDashboard"
          element={
            <ProtectedRoute>
              <ResponderDashboard />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/RegionAdminProfile"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <RegionAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/ProvinceAdminProfile"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <ProvinceAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/CityAdminProfile"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <CityAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/DepartmentAdminDashboard"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <DepartmentAdminDashboard setNewReportsCount={setNewReportsCount}/>
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path='/DepartmentAdminProfile'
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <DepartmentAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/AddResponder"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <AddResponderPage />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/SuperAdminDashboard"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/SuperAdminProfile"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <SuperAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/ReportDetails/:id"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <ReportDetails />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/setup-account"
          element={
            <ProtectedRoute>
              <SetupAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/CityAdminDashboard"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <CityAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/ProvinceAdminDashboard"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <ProvinceAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/RegionAdminDashboard"
          element={
            <AdminLayout newReportsCount={newReportsCount} onSidebarNavigate={handleDepartmentSidebarNavigation}>
              <ProtectedRoute>
                <RegionAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;