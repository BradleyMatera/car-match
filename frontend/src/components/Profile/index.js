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
  const [userEvents, setUserEvents] = useState([]);
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
        const events = await mockApi.getUserEvents('user1');
        setUserEvents(events);
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
      <Section>
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
      </Section>

      <Section>
        <h2>About Me</h2>
        <p className="bio">{user.bio}</p>
        {editing && (
          <div className="edit-section">
            <label>
              Bio:
              <textarea
                name="bio"
                value={updatedUser.bio}
                onChange={handleInputChange}
                rows="4"
              />
            </label>
          </div>
        )}
      </Section>

      <Section>
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
        {editing && (
          <div className="edit-section">
            <button className="btn btn-secondary">Add Car</button>
          </div>
        )}
      </Section>

      <Section>
        <h2>My Events</h2>
        {userEvents.length > 0 ? (
          <Grid cols={1} mdCols={2} gap="md">
            {userEvents.map(event => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p>📍 {event.location}</p>
              </div>
            ))}
          </Grid>
        ) : (
          <p>No events registered yet.</p>
        )}
      </Section>

      <Section background="light">
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
            <label>
              Age:
              <input
                type="number"
                name="age"
                value={updatedUser.age}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Car Interests (comma separated):
              <input
                type="text"
                name="carInterests"
                value={updatedUser.carInterests.join(', ')}
                onChange={(e) => {
                  const interests = e.target.value.split(', ').filter(Boolean);
                  setUpdatedUser(prev => ({ ...prev, carInterests: interests }));
                }}
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
      </Section>

      <Section>
        <h2>Messages</h2>
        <Messages userId="user1" />
      </Section>
    </div>
  );
};

export default Profile;
