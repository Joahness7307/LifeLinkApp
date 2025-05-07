import React, { useState } from 'react'; // Add useState here
import { Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import SubmitReport from './pages/SubmitReport';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized'; 
import ResponderDashboard from './pages/ResponderDashboard'; 
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';
import ReportDetails from './pages/ReportDetails';
import CompleteProfile from './pages/CompleteProfile';
import GoogleAuthHandler from './pages/GoogleAuthHandler'; // Import the GoogleAuthHandler page
import '../src/styles/index.css';

function App() {
  const [notifications, setNotifications] = useState([]); // Move notifications state here

  return (
    <div className="App">
      <Navbar notifications={notifications} setNotifications={setNotifications} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/UserDashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ResponderDashboard"
          element={
            <ProtectedRoute>
              <ResponderDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route path="/SubmitReport" element={<SubmitReport />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Pass setNotifications to ReportDetails */}
        <Route
          path="/reports/:alertId"
          element={<ReportDetails setNotifications={setNotifications} />}
        />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        {/* Add GoogleAuthHandler route */}
        <Route path="/auth/google/callback" element={<GoogleAuthHandler />} />
        {/* Add a fallback route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;