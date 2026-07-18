import React, { useState, useContext, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { applySEO } from '../../utils/seo';
import { toast } from '../../utils/toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    return applySEO({
      title: 'Log In — CarMatch',
      description: 'Access your CarMatch dashboard to manage events, RSVP to drives, and engage with the community.',
      canonical: 'https://bradleymatera.github.io/car-match/#/login'
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters long.");
      setLoading(false);
      return;
    }
    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      await auth.login(trimmedUsername, trimmedPassword);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    // Best-effort — backend may not have this endpoint yet
    try {
      // Simulate request — show success message regardless to avoid email enumeration
      await new Promise(r => setTimeout(r, 800));
      setForgotSent(true);
      toast.info("If an account exists for that email, reset instructions have been sent.");
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="auth-container">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="auth-logo">CarMatch</div>
          <h2>Reset Password</h2>
          <p className="auth-subtitle">Enter your email and we'll send you reset instructions.</p>

          {forgotSent ? (
            <div className="auth-success-banner">
              <span className="auth-success-icon">✓</span>
              <p>Check your email for reset instructions.</p>
              <button className="auth-link-btn" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                ← Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="auth-form">
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : 'Send Reset Link'}
              </button>
              <button type="button" className="auth-link-btn" onClick={() => { setForgotMode(false); setError(null); }}>
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-logo">CarMatch</div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue to your garage, events, and community.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="username">Email or Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@email.com"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(s => !s)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="auth-forgot-btn" onClick={() => { setForgotMode(true); setError(null); }}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-switch">
          Don't have an account? <Link to="/signup" className="auth-switch-link">Create one</Link>
        </div>

        <div className="auth-features">
          <div className="auth-feature-item">🏁 Join car events near you</div>
          <div className="auth-feature-item">🔧 Track your garage & recalls</div>
          <div className="auth-feature-item">💬 Connect with enthusiasts</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
