import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import '../styles/Login.css';
import appLogo from '../assets/appLogo.png';
import eyeIcon from '../assets/eye.png';
import eyeSlashIcon from '../assets/hidden.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { login, isLoading, error } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await login(email, password);
    if (success) {
      navigate('/emergencies'); // Redirect to the emergency page
    }
  }

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
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
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
                className="toggle-password-icon2"
                onClick={togglePasswordVisibility}
              />
            </div>
            <button type="submit" className="auth-button" disabled={isLoading}>Login</button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="auth-link">
            Don't have an account? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </div>
    </div>
  );  
}

export default Login;