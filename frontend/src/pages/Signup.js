import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Signup.css';
import eyeIcon from '../assets/eye.png';
import eyeSlashIcon from '../assets/hidden.png';

const Signup = () => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // const handleGoogleSignup = () => {
  //   window.location.href = 'http://localhost:3000/auth/google?prompt=select_account'; // Adjust if needed
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const response = await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      alert('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } else {
      setError(data.error); 
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-card">
          <h2>Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div className="signup-input-group">
              <input
                type="text"
                placeholder="Username"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="signup-input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="signup-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <img
                src={showPassword ? eyeSlashIcon : eyeIcon}
                alt="Toggle Password Visibility"
                className="signup-toggle-password-icon"
                onClick={togglePasswordVisibility}
                style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', width: 20, height: 20 }}
              />
            </div>
            <button type="submit" className="signup-button">Sign Up</button>
            {error && <p className="error">{error}</p>}
          </form>
          {/* <button onClick={handleGoogleSignup} className="signup-google-btn">
            Continue with Google
          </button> */}
          <p className="signup-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;