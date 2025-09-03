import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import mockApi from '../../api/mockApi'; // Assuming this now includes registerUser to backend
import AuthContext from '../../context/AuthContext';
import './SignUp.css';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use email as username if username field is not separate
    const registrationData = {
      ...formData,
      username: formData.username || formData.email, // Assuming email can be username
    };
    
    // Validate required fields for backend
    if (!registrationData.username || !registrationData.password || !registrationData.name || !registrationData.displayTag || !registrationData.gender || !registrationData.city || !registrationData.state) {
        setError("All fields are required: Username (or Email), Password, Name, Display Tag, Gender, City, State.");
        setLoading(false);
        return;
    }

    try {
      const response = await mockApi.registerUser(registrationData); // Calls backend /register
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
