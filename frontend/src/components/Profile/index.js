import React, { useState, useEffect, useCallback, useContext } from 'react';
import './Profile.css';
import mockApi from '../../api/mockApi';
import AuthContext from '../../context/AuthContext';
import Section from '../Section';
import Grid from '../Grid';
import Spacing from '../Spacing';

const UpgradeModal = ({ show, onClose, onUpgrade }) => {
  if (!show) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Upgrade Required</h3>
        <p>This feature or action requires a premium account.</p>
        <button onClick={onUpgrade} className="btn btn-success">Upgrade to Premium</button>
        <button onClick={onClose} className="btn">Close</button>
      </div>
    </div>
  );
};

const Profile = () => {
  const { currentUser, token, updateCurrentUser } = useContext(AuthContext);

  const [userEvents, setUserEvents] = useState([]);
  const [loadingProfileData, setLoadingProfileData] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(currentUser || {});

  const [messages, setMessages] = useState([]);
  const [activeMessageTab, setActiveMessageTab] = useState('inbox');
  const [messageFilters, setMessageFilters] = useState({ gender: '', radius: '', sortBy: 'timestamp' });
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isEffectivelyPremium = currentUser?.premiumStatus || currentUser?.developerOverride;

  useEffect(() => {
    if (currentUser) {
      setUpdatedUser(currentUser);
    } else {
      setLoadingProfileData(false);
    }
  }, [currentUser]);

  const fetchMessagesForTab = useCallback(async (tab, currentFilters) => {
    if (!currentUser || !token) return;
    setLoadingMessages(true);
    setMessageError(null);
    let categoryToFetch = tab;
    let clientSideMessages = [];

    try {
      if (tab === 'system') {
        // Client-side filter for system messages from mock or a dedicated endpoint if available
        const allInboxMessages = await mockApi.fetchMessages(token, 'inbox', {}); // Fetch all to find system
        clientSideMessages = allInboxMessages.filter(msg => msg.systemMessage === true && msg.recipientId === currentUser.id);
        setMessages(clientSideMessages);
      } else {
        const apiFilters = isEffectivelyPremium ? currentFilters : {};
        const fetchedMessages = await mockApi.fetchMessages(token, categoryToFetch, apiFilters);
        setMessages(fetchedMessages);
      }
    } catch (err) {
      setMessageError(err.message || 'Failed to load messages.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser, token, isEffectivelyPremium]); // Added isEffectivelyPremium

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) {
        setLoadingProfileData(false);
        return;
      }
      setLoadingProfileData(true);
      setProfileError(null);
      try {
        if (token) {
          const events = await mockApi.getUserEvents(currentUser.id);
          setUserEvents(events);
        }
        // Initial fetch for the default tab
        fetchMessagesForTab(activeMessageTab, messageFilters);
      } catch (err) {
        setProfileError('Failed to load initial profile page data.');
        console.error(err);
      } finally {
        setLoadingProfileData(false);
      }
    };
    if (currentUser && token) { // Ensure currentUser and token are available
        fetchInitialData();
    } else {
        setLoadingProfileData(false); // Not logged in or no token
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [currentUser, token]); // Only re-run if user or token changes for initial load

   useEffect(() => {
    if (currentUser && token) {
        fetchMessagesForTab(activeMessageTab, messageFilters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessageTab, messageFilters]); // Re-fetch when tab or filters change


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || !token || !recipientUsername || !newMessageText) {
      alert("Recipient and message text are required.");
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await mockApi.sendMessage(token, recipientUsername, newMessageText);
      if (response.action === "upgradeRequired") {
        setShowUpgradeModal(true);
        setMessageError(response.message);
      } else {
        setNewMessageText('');
        setRecipientUsername('');
        setReplyingTo(null);
        alert('Message sent!');
        fetchMessagesForTab(activeMessageTab, messageFilters);
      }
    } catch (err) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser || !token) return;
    try {
      const dataToSave = { ...updatedUser };
      ['id', 'token', 'username', 'password', 'activityMetadata', 'tierSpecificHistory', 'createdAt', 'lastLoginTimestamp'].forEach(key => delete dataToSave[key]);
      await mockApi.updateProfile(dataToSave); // Assumes mockApi.updateProfile is sufficient
      updateCurrentUser(dataToSave);
      setEditing(false);
      alert('Profile updated (locally/mock). Full backend update for profile save needed.');
    } catch (err) {
      alert(`Failed to save changes: ${err.message}`);
    }
  };

  const handleUpgradePremium = async () => {
    if (!currentUser || !token) return;
    try {
      const updatedUserData = await mockApi.upgradeToPremium(token, currentUser.id);
      updateCurrentUser(updatedUserData.user);
      setShowUpgradeModal(false);
      alert('Successfully upgraded to premium!');
    } catch (error) {
      alert(`Failed to upgrade: ${error.message}`);
    }
  };

  const handleToggleDevOverride = async () => {
    if (!currentUser || !token) return;
    try {
      const updatedUserData = await mockApi.toggleDevOverride(token, currentUser.id);
      updateCurrentUser(updatedUserData.user);
      alert(`Developer override set to: ${updatedUserData.user.developerOverride}.`);
    } catch (error) {
      alert(`Failed to toggle dev override: ${error.message}`);
    }
  };

  const handleReply = (messageToReplyTo) => {
    if (!isEffectivelyPremium && messageToReplyTo.isLocked) {
        setShowUpgradeModal(true);
        return;
    }
    setRecipientUsername(messageToReplyTo.senderUsername);
    const quotedText = `> ${messageToReplyTo.text.split('\n').join('\n> ')}\n\n`;
    setNewMessageText(quotedText);
    setReplyingTo(messageToReplyTo);
    document.getElementById('newMessageTextarea')?.focus();
  };

  const toggleMessageReadStatus = async (messageId, currentReadStatus) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, read: !currentReadStatus } : msg
      )
    );
    // Mock API call: await mockApi.markMessageAsReadUnread(token, messageId, !currentReadStatus);
  };

  const handleFilterChange = (e) => {
    setMessageFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyMessageFilters = () => {
    if (!isEffectivelyPremium && (messageFilters.gender || messageFilters.radius || messageFilters.sortBy === 'proximity')) {
      setShowUpgradeModal(true);
      return;
    }
    fetchMessagesForTab(activeMessageTab, messageFilters);
  };

  if (loadingProfileData) return <div className="profile-container">Loading profile...</div>;
  if (!currentUser) return <div className="profile-container">Please log in to view your profile.</div>;
  if (profileError) return <div className="profile-container">{profileError}</div>;

  return (
    <div className="profile-container">
      <UpgradeModal show={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradePremium} />
      <Section>
        <div className="profile-header">
          <div className="profile-photo-container">
            <img
              src={currentUser.profileImage || "https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg"}
              alt="Profile"
              className="profile-photo"
            />
            <div className="profile-photo-edit"><span>📷</span></div>
          </div>
          <div className="profile-info">
            <h1>{currentUser.name || currentUser.username}, {currentUser.age || 'N/A'}</h1>
            <p className="location">
              <span>📍</span> {currentUser.location?.city || 'Unknown City'}, {currentUser.location?.state || 'N/A'}
            </p>
            <div className="car-interests">
              {(currentUser.carInterests || []).map((interest) => (
                <span key={interest} className="interest-tag">{interest}</span>
              ))}
            </div>
            <div className="premium-status-display">
              <p>Status: {isEffectivelyPremium ? <strong>Premium User</strong> : 'Free User'} {currentUser.developerOverride && '(Dev Override ON)'}</p>
              {!currentUser.premiumStatus && !currentUser.developerOverride && <button onClick={handleUpgradePremium} className="btn btn-success">Upgrade to Premium</button>}
              <button onClick={handleToggleDevOverride} className="btn btn-warning">
                Toggle Dev Override ({currentUser.developerOverride ? 'ON' : 'OFF'})
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <h2>About Me</h2>
        <p className="bio">{currentUser.bio || 'No bio yet.'}</p>
        {editing && (
          <div className="edit-section">
            <label>Bio:
              <textarea name="bio" value={updatedUser.bio || ''} onChange={handleInputChange} rows="4"/>
            </label>
          </div>
        )}
      </Section>

      <Section>
        <h2>My Garage</h2>
        <Grid cols={1} mdCols={2} lgCols={3} gap="lg">
          {(currentUser.cars || []).map((car, index) => (
            <div key={car.id || index} className="car-card">
              <img src={car.photos?.[0] || 'https://via.placeholder.com/300x200.png?text=No+Image'} alt={car.name} />
              <h3>{car.name}</h3>
              <p>{car.description}</p>
            </div>
          ))}
        </Grid>
        {editing && (<div className="edit-section"><button className="btn btn-secondary">Add Car</button></div>)}
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
        ) : (<p>No events registered or created yet.</p>)}
      </Section>

      <Section background="light">
        <h2>Account Settings</h2>
        {editing ? (
          <div className="settings-form">
            <label>Name: <input type="text" name="name" value={updatedUser.name || ''} onChange={handleInputChange}/></label>
            <label>Email: <input type="email" name="email" value={updatedUser.email || ''} onChange={handleInputChange} disabled /> </label>
            <label>Display Tag: <input type="text" name="displayTag" value={updatedUser.displayTag || ''} onChange={handleInputChange} /></label>
            <label>Gender: 
              <select name="gender" value={updatedUser.gender || ''} onChange={handleInputChange}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Location (City): <input type="text" name="city" value={updatedUser.location?.city || ''} onChange={(e) => setUpdatedUser(prev => ({...prev, location: {...(prev.location || {}), city: e.target.value}}))} /></label>
            <label>Location (State): <input type="text" name="state" value={updatedUser.location?.state || ''} onChange={(e) => setUpdatedUser(prev => ({...prev, location: {...(prev.location || {}), state: e.target.value}}))} /></label>
            <label>Age: <input type="number" name="age" value={updatedUser.age || ''} onChange={handleInputChange} /></label>
            <label>Car Interests (comma separated):
              <input type="text" name="carInterests" value={(updatedUser.carInterests || []).join(', ')}
                onChange={(e) => {
                  const interests = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setUpdatedUser(prev => ({ ...prev, carInterests: interests }));
                }}/>
            </label>
            <div className="settings-actions">
              <button onClick={handleSave}>Save Changes</button>
              <button onClick={() => { setEditing(false); setUpdatedUser(currentUser); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="settings-view">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Display Tag:</strong> {currentUser.displayTag}</p>
            <p><strong>Gender:</strong> {currentUser.gender}</p>
            <p><strong>Location:</strong> {currentUser.location?.city}, {currentUser.location?.state}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Settings</button>
          </div>
        )}
      </Section>

      <Section>
        <h2>My Messages</h2>
        <div className="message-tabs">
          {['inbox', 'unread', 'sent', 'system', ...(!isEffectivelyPremium ? ['locked'] : [])].map(tabName => (
            <button 
              key={tabName}
              onClick={() => setActiveMessageTab(tabName)} 
              className={activeMessageTab === tabName ? 'active' : ''}
            >
              {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </button>
          ))}
        </div>

        {isEffectivelyPremium && activeMessageTab !== 'system' && ( // Hide filters for system messages tab
          <div className="message-filters">
            <select name="gender" value={messageFilters.gender} onChange={handleFilterChange}>
              <option value="">Filter by Sender's Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input type="number" name="radius" placeholder="Radius (miles)" value={messageFilters.radius} onChange={handleFilterChange}/>
            <select name="sortBy" value={messageFilters.sortBy} onChange={handleFilterChange}>
                <option value="timestamp">Sort by Date</option>
                <option value="proximity">Sort by Proximity</option>
            </select>
            <button onClick={applyMessageFilters}>Apply Filters</button>
          </div>
        )}

        <div className="message-list">
          {loadingMessages && <p>Loading messages...</p>}
          {messageError && <p className="error-text">{messageError}</p>}
          {!loadingMessages && !messageError && messages.length === 0 && <p>No messages in this category.</p>}
          {!loadingMessages && !messageError && messages.map(msg => (
            <div key={msg.id} className={`message-item ${msg.senderId === currentUser.id ? 'sent-by-me' : 'received-by-me'} ${msg.isLocked ? 'locked-message' : ''} ${msg.systemMessage ? 'system-message-item' : ''}`}>
              <p>
                <strong className={!msg.read && msg.recipientId === currentUser.id && !msg.systemMessage ? 'unread-sender' : ''}>
                  {msg.senderId === currentUser.id ? `To: ${msg.recipientUsername}` : `From: ${msg.senderUsername}`}
                </strong> 
                {msg.senderEffectivePremiumStatus && msg.senderId !== currentUser.id && !msg.systemMessage && <span className="premium-sender-badge">👑 Premium</span>}
              </p>
              <p className="message-text">{msg.text}</p>
              <small>{new Date(msg.timestamp).toLocaleString()} {!msg.systemMessage && (msg.read ? '- Read' : '- Unread')}</small>
              {msg.isLocked && <span className="locked-indicator">(Upgrade to read full message or reply)</span>}
              {!msg.systemMessage && (
                <div className="message-actions">
                  {msg.recipientId === currentUser.id && ( // Can only reply to received messages
                    <button onClick={() => handleReply(msg)} className={`reply-button btn-small ${msg.isLocked ? 'btn-warning' : ''}`}>
                      {msg.isLocked ? 'Unlock to Reply' : 'Reply'}
                    </button>
                  )}
                  {msg.recipientId === currentUser.id && ( // Only allow marking received messages
                    <button onClick={() => toggleMessageReadStatus(msg.id, msg.read)} className="mark-read-button btn-small">
                      {msg.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Spacing top="md" />
        <h3>Send New Message</h3>
        <form onSubmit={handleSendMessage} className="send-message-form">
          <input type="text" placeholder="Recipient Username" value={recipientUsername} onChange={(e) => setRecipientUsername(e.target.value)} required />
          <textarea id="newMessageTextarea" placeholder="Your message..." value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} required />
          <button type="submit" disabled={loadingMessages}>{loadingMessages ? "Sending..." : "Send Message"}</button>
        </form>
      </Section>
    </div>
  );
};

export default Profile;
