import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import '../styles/Login.css';
import eyeIcon from '../assets/eye.png';
import eyeSlashIcon from '../assets/hidden.png';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Email or Contact Number
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { login, isLoading, error } = useLogin();

  // const handleGoogleLogin = () => {
  //   window.location.href = 'http://localhost:3000/auth/google?prompt=select_account'; // Redirect to Google OAuth
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(identifier, password); // Call the login function
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Toggle the password visibility
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <input
                type="text"
                name="identifier"
                required
                placeholder="Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="login-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <img
                src={showPassword ? eyeSlashIcon : eyeIcon}
                alt="Toggle Password Visibility"
                className="login-toggle-password-icon"
                onClick={togglePasswordVisibility}
                style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', width: 20, height: 20 }}
              />
            </div>
            <button type="submit" className="login-button" disabled={isLoading}>
              Login
            </button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="login-forgot-password-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
          {/* <button onClick={handleGoogleLogin} className="login-google-btn">
            Continue with Google
          </button> */}
          {/* <p className="login-link">
            Don't have an account? <Link to="/signup">Signup</Link>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default Login;