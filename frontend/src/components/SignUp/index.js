import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import './SignUp.css';
import { applySEO } from '../../utils/seo';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '', // Will use email as username for simplicity, or add a username field
    password: '',
    name: '',
    displayTag: '',
    gender: '',
    city: '',
    state: '',
    // Optional fields from backend model, can be added to form later
    // age: '', 
    // carInterests: [],
    // bio: '',
    // profileImage: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useContext(AuthContext); // auth was unused

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

  useEffect(() => {
    return applySEO({
      title: 'Create Account',
      description: 'Join CarMatch to bookmark events, participate in forums, and connect with other car enthusiasts.',
      canonical: 'https://bradleymatera.github.io/car-match/#/signup'
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev };
      switch (name) {
        case 'username':
          next.username = value;
          break;
        case 'password':
          next.password = value;
          break;
        case 'name':
          next.name = value;
          break;
        case 'displayTag':
          next.displayTag = value;
          break;
        case 'gender':
          next.gender = value;
          break;
        case 'city':
          next.city = value;
          break;
        case 'state':
          next.state = value;
          break;
        default:
          return prev;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Start Validation ---
    const { username, password, name, displayTag, gender, city, state } = formData;

    // Basic presence check
    if (!username || !password || !name || !displayTag || !gender || !city || !state) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setError("Please enter a valid email address for the username.");
      setLoading(false);
      return;
    }

    // Password strength validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    // Display Tag validation
    const tagRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!tagRegex.test(displayTag)) {
      setError("Display Tag must be 3-15 characters and contain only letters, numbers, and underscores.");
      setLoading(false);
      return;
    }
    
    // State abbreviation validation
    const stateRegex = /^[A-Z]{2}$/;
    if (!stateRegex.test(state)) {
      setError("Please enter a valid 2-letter state abbreviation (e.g., CA).");
      setLoading(false);
      return;
    }
    // --- End Validation ---

    const registrationData = {
      ...formData,
      username: formData.username,
    };

    try {
      const response = await api.registerUser(registrationData);
      console.log('Registration successful:', response);
      alert('Registration successful! Please log in.');
      navigate('/login'); // Navigate to login page after successful registration
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div
        className="page-bg signup-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${currentBackground})`
        }}
      />
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>Create Your Account</h2>
        {error && <p className="error-text">{error}</p>}
        
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required disabled={loading} />
        <input type="email" name="username" placeholder="Email (will be your username)" value={formData.username} onChange={handleChange} required disabled={loading} />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required disabled={loading} />
        <input type="text" name="displayTag" placeholder="Display Tag (e.g., AJ_Rides)" value={formData.displayTag} onChange={handleChange} required disabled={loading} />
        
        <select name="gender" value={formData.gender} onChange={handleChange} required disabled={loading}>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
        
        <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required disabled={loading} />
        <input type="text" name="state" placeholder="State (e.g., CA)" value={formData.state} onChange={handleChange} required disabled={loading} />
        
        {/* Add other fields like age, bio, carInterests as needed */}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
