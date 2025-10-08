import React, { useState, useContext, useEffect, useMemo } from 'react';
// import api from '../../api/client'; // login will be called via context
import AuthContext from '../../context/AuthContext';
import './Login.css';
import { useNavigate } from 'react-router-dom'; // For redirecting after login

const Login = () => { // Removed onLoginSuccess prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Start Validation ---
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Basic presence check
    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    // Username format validation (allow email or username)
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    // Password length validation
    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      await auth.login(trimmedUsername, trimmedPassword);
      // Login successful, AuthContext will update state. App.js will re-render.
      // Navigate to home page or dashboard after successful login
      navigate('/'); 
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Background images (rotates like Events)
  const bgImages = useMemo(() => ([
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'
  ]), []);
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBgIndex(i => (i + 1) % bgImages.length), 8000);
    return () => clearInterval(id);
  }, [bgImages]);

  const currentBackground = useMemo(
    () => (Array.isArray(bgImages) ? bgImages.at(bgIndex) ?? '' : ''),
    [bgImages, bgIndex]
  );

  return (
    <div className="login-container">
      <div
        className="page-bg login-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${currentBackground})`
        }}
      />
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">Email or Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
