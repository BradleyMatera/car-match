import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    location: '',
    carInterests: [],
    photos: []
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCarInterestChange = (interest) => {
    setFormData(prev => {
      const interests = prev.carInterests.includes(interest)
        ? prev.carInterests.filter(i => i !== interest)
        : [...prev.carInterests, interest];
      return { ...prev, carInterests: interests };
    });
  };

  const handlePhotoUpload = (e) => {
    // Mock photo upload functionality
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, photos: files }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Mock form submission
      console.log('Form submitted:', formData);
      navigate('/profile');
    }
  };

  const carCategories = [
    'Muscle Cars', 'JDM', 'Classic Cars', 
    'Sports Cars', 'Luxury', 'Off-Road', 'Electric Vehicles'
  ];

  return (
    <div className="signup-container">
      <h1>Sign Up ({step}/5)</h1>
      
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="signup-step">
            <h2>Account Basics</h2>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {step === 2 && (
          <div className="signup-step">
            <h2>Personal Details</h2>
            <input
              type="number"
              name="age"
              placeholder="Age"
              min="18"
              value={formData.age}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location (City or ZIP)"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {step === 3 && (
          <div className="signup-step">
            <h2>Car Interests</h2>
            <div className="car-interests">
              {carCategories.map(category => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={formData.carInterests.includes(category)}
                    onChange={() => handleCarInterestChange(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="signup-step">
            <h2>Profile Photo</h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
            />
            <p>Tip: Include a photo of you with your car to spark conversations!</p>
          </div>
        )}

        {step === 5 && (
          <div className="signup-step">
            <h2>Welcome, {formData.name}!</h2>
            <p>Your profile is ready. Start exploring other car enthusiasts now.</p>
          </div>
        )}

        <div className="signup-actions">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button type="submit">
            {step === 5 ? 'Go to Dashboard' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
