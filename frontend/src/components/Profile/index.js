import React, { useState, useEffect } from 'react';
import './Profile.css';
import mockApi from '../../api/mockApi';
import Messages from '../Messages';
import Section from '../Section';
import Container from '../Container';
import Grid from '../Grid';
import Spacing from '../Spacing';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await mockApi.getProfile('user1');
        setUser(profile);
        setUpdatedUser(profile);
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await mockApi.updateProfile(updatedUser);
      setUser(updatedUser);
      setEditing(false);
    } catch (err) {
      alert('Failed to save changes.');
    }
  };

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-container">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-photo-container">
          <img
            src="https://media.licdn.com/dms/image/v2/D5603AQE7mZivGAYS5w/profile-displayphoto-shrink_800_800/B56ZVDZEbxHoAg-/0/1740592400767?e=1752105600&v=beta&t=trY3Bv-fYbjMqgsd4bcETu03MgDWF9Jmz0M76PCFt8c"
            alt="Profile"
            className="profile-photo"
          />
          <div className="profile-photo-edit">
            <span>📷</span>
          </div>
        </div>
        <div className="profile-info">
          <h1>{user.name}, {user.age}</h1>
          <p className="location">
            <span>📍</span> {user.location}
          </p>
          <div className="car-interests">
            {user.carInterests.map((interest) => (
              <span key={interest} className="interest-tag">{interest}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2>About Me</h2>
        <p className="bio">{user.bio}</p>
      </div>

      <div className="profile-section">
        <h2>My Garage</h2>
        <Grid cols={1} mdCols={2} lgCols={3} gap="lg">
          {user.cars.map((car, index) => (
            <div key={index} className="car-card">
              <img src={car.photos[0]} alt={car.name} />
              <h3>{car.name}</h3>
              <p>{car.description}</p>
            </div>
          ))}
        </Grid>
      </div>

      <div className="profile-section">
        <h2>Account Settings</h2>
        {editing ? (
          <div className="settings-form">
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={updatedUser.name}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={updatedUser.email}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Location:
              <input
                type="text"
                name="location"
                value={updatedUser.location}
                onChange={handleInputChange}
              />
            </label>
            <div className="settings-actions">
              <button onClick={handleSave}>Save Changes</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="settings-view">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Location:</strong> {user.location}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Settings</button>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2>Messages</h2>
        <Messages userId="user1" />
      </div>
    </div>
  );
};

export default Profile;
