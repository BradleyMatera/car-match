import React, { useState } from 'react';
import './EntryModal.css';

const EntryModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    carPreference: '',
    ageRange: { min: '', max: '' },
    zipCode: '',
    nickname: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.carPreference || !formData.ageRange.min || !formData.ageRange.max || !formData.zipCode || !formData.email || !formData.password) {
      alert('Please fill out all required fields.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="entry-modal">
      <div className="modal-content">
        <h1>Welcome to CarMatch</h1>
        <p>Let’s get started by creating your profile.</p>
        <form onSubmit={handleSubmit}>
          <label>
            What type of cars are you into?
            <select name="carPreference" value={formData.carPreference} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="Muscle">Muscle</option>
              <option value="JDM">JDM</option>
              <option value="Classic">Classic</option>
              <option value="Off-Road">Off-Road</option>
            </select>
          </label>
          <label>
            Age Range
            <div className="age-range">
              <input
                type="number"
                name="min"
                placeholder="Min"
                value={formData.ageRange.min}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  ageRange: { ...prev.ageRange, min: e.target.value }
                }))}
                required
              />
              <input
                type="number"
                name="max"
                placeholder="Max"
                value={formData.ageRange.max}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  ageRange: { ...prev.ageRange, max: e.target.value }
                }))}
                required
              />
            </div>
          </label>
          <label>
            Zip Code
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Name or Nickname
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit">Get Started</button>
        </form>
      </div>
    </div>
  );
};

export default EntryModal;
