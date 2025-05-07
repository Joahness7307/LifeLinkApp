import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import '../styles/Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Email or Contact Number
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useLogin();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google'; // Redirect to Google OAuth
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(identifier, password); // Call the login function
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                name="identifier"
                required
                placeholder="Email or Contact Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                name="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-button" disabled={isLoading}>
              Login
            </button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="forgot-password-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
          <button onClick={handleGoogleLogin} className="google-login-btn">
            Continue with Google
          </button>
          <p className="auth-link">
            Don't have an account? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;