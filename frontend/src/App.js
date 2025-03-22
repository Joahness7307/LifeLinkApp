import React from 'react';
import { Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import EmergencyList from './pages/EmergencyList';
import SubmitReport from './pages/SubmitReport';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import '../src/styles/index.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/emergencies"
          element={
            <ProtectedRoute>
              <EmergencyList />
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
      </Routes>
    </div>
  );
}

export default App;