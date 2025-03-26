import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import '../styles/Signup.css';
import appLogo from '../assets/appLogo.png';
import eyeIcon from '../assets/eye.png';
import eyeSlashIcon from '../assets/hidden.png';

const Signup = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('user'); // Default role is 'user'
  const [agencyId, setAgencyId] = useState(''); // For responders
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { signup, error, isLoading } = useSignup();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await signup(userName, email, password, phoneNumber, address, role, agencyId);
    if (success) {
      navigate('/login'); // Redirect to the login page after successful signup
    } 
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="emergency-pulse"></div>
      <div className="auth-content">
        <div className="logo-container">
          <img src={appLogo} alt="LifeLink Logo" className="auth-logo" />
        </div>
        <div className="auth-card">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="userName"
                required
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                name="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'} // Toggle input type
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <img
                src={showPassword ? eyeSlashIcon : eyeIcon} // Toggle icon
                alt="Toggle Password Visibility"
                className="toggle-password-icon"
                onClick={togglePasswordVisibility}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="phoneNumber"
                required
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="address"
                required
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="role">Role:</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="responder">Responder</option>
              </select>
            </div>
            {role === 'responder' && (
              <div className="input-group">
                <input
                  type="text"
                  name="agencyId"
                  required
                  placeholder="Agency ID"
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                />
              </div>
            )}
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
            {error && <div className="error">{error}</div>}
          </form>
          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;