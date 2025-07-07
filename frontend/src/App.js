import React, { useState } from 'react';
import { Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
// import Signup from './pages/Signup';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized'; 
import ResponderDashboard from './pages/ResponderDashboard'; 
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';
import GoogleAuthHandler from './pages/GoogleAuthHandler';
import '../src/styles/index.css';
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
import AdminLayout from './components/AdminLayout';

function App() {
  const [notifications, setNotifications] = useState([]); // Move notifications state here

  return (
    <div className="App">
      <Navbar notifications={notifications} setNotifications={setNotifications} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/signup" element={<Signup />} /> */}
        <Route
          path="/ResponderDashboard"
          element={
            <ProtectedRoute>
              <ResponderDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/RegionAdminProfile" 
          element={
            <AdminLayout>
              <ProtectedRoute>
                <RegionAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          } 
        />
        <Route
          path="/ProvinceAdminProfile" 
          element={
            <AdminLayout>
              <ProtectedRoute>
                <ProvinceAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route
          path="/CityAdminProfile" 
          element={
            <AdminLayout>
              <ProtectedRoute>
                <CityAdminProfile />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route 
          path="/DepartmentAdminDashboard" 
          element={
            <ProtectedRoute>
                <DepartmentAdminDashboard />
            </ProtectedRoute>
        } />
        <Route 
          path='/DepartmentAdminProfile'
          element={
            <ProtectedRoute>
                <DepartmentAdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AddResponder"
          element={
            <ProtectedRoute>
              <AddResponderPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/SuperAdminDashboard" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SuperAdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/SuperAdminProfile" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SuperAdminProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ReportDetails/:id"
          element={
            <ProtectedRoute>
              <ReportDetails />
            </ProtectedRoute>
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
        } />
        <Route 
          path="/CityAdminDashboard" 
          element={
            <AdminLayout>
              <ProtectedRoute>
                <CityAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
        } />
        <Route
          path="/ProvinceAdminDashboard"
          element={
            <AdminLayout>
              <ProtectedRoute>
                <ProvinceAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          }
        />
        <Route 
          path="/RegionAdminDashboard" 
          element={
            <AdminLayout>
              <ProtectedRoute>
                <RegionAdminDashboard />
              </ProtectedRoute>
            </AdminLayout>
          } />
        {/* Add GoogleAuthHandler route */}
        <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        {/* Add a fallback route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;