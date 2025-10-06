import React, { useState, useEffect, useCallback, useContext } from 'react';
import './Profile.css';
import './profile.cards.css';
import api from '../../api/client';
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
  const [myRsvpMap, setMyRsvpMap] = useState(() => new Map());
  const [loadingProfileData, setLoadingProfileData] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(currentUser || {});
  const [prefs, setPrefs] = useState(currentUser?.preferences || { notifications:{}, privacy:{}, display:{}, connections:{} });

  const [messages, setMessages] = useState([]);
  const [activeMessageTab, setActiveMessageTab] = useState('inbox');
  const [messageFilters, setMessageFilters] = useState({ gender: '', radius: '', sortBy: 'timestamp' });
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  // const [replyingTo, setReplyingTo] = useState(null); // replyingTo was unused
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isEffectivelyPremium = currentUser?.premiumStatus || currentUser?.developerOverride;
  const [activeTab, setActiveTab] = useState('profile'); // profile|garage|events|settings|messages

  useEffect(() => {
    if (currentUser) {
      setUpdatedUser(currentUser);
      setPrefs(currentUser.preferences || { notifications:{}, privacy:{}, display:{}, connections:{} });
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
        const allInboxMessages = await api.fetchMessages(token, 'inbox', {}); // Fetch all to find system
        clientSideMessages = allInboxMessages.filter(msg => msg.systemMessage === true && msg.recipientId === currentUser.id);
        setMessages(clientSideMessages);
      } else {
        const apiFilters = isEffectivelyPremium ? currentFilters : {};
        const fetchedMessages = await api.fetchMessages(token, categoryToFetch, apiFilters);
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
          const events = await api.getUserEvents(currentUser.id);
          setUserEvents(events);
          try {
            const mine = await api.getMyRsvps(token);
            const map = new Map();
            (mine || []).forEach(r => map.set(String(r.eventId), true));
            setMyRsvpMap(new Map(map));
          } catch {}
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
      const response = await api.sendMessage(token, recipientUsername, newMessageText);
      if (response.action === "upgradeRequired") {
        setShowUpgradeModal(true);
        setMessageError(response.message);
      } else {
        setNewMessageText('');
        setRecipientUsername('');
        // setReplyingTo(null); // replyingTo was unused
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
    setUpdatedUser((prev) => {
      const next = { ...prev };
      switch (name) {
        case 'name':
          next.name = value;
          break;
        case 'displayTag':
          next.displayTag = value;
          break;
        case 'gender':
          next.gender = value;
          break;
        case 'bio':
          next.bio = value;
          next.biography = value;
          break;
        case 'email':
          next.email = value;
          break;
        case 'age':
          next.age = value;
          break;
        case 'biography':
          next.biography = value;
          break;
        case 'profileImage':
          next.profileImage = value;
          break;
        default:
          return prev;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!currentUser || !token) return;
    try {
      const dataToSave = { preferences: prefs };
      if (typeof updatedUser.name === 'string') dataToSave.name = updatedUser.name;
      if (typeof updatedUser.displayTag === 'string') dataToSave.displayTag = updatedUser.displayTag;
      if (typeof updatedUser.gender === 'string') dataToSave.gender = updatedUser.gender;
      if (typeof updatedUser.biography === 'string') dataToSave.biography = updatedUser.biography;
      if (typeof updatedUser.profileImage === 'string') dataToSave.profileImage = updatedUser.profileImage;
      if (updatedUser.location && typeof updatedUser.location === 'object') dataToSave.location = updatedUser.location;
      const resp = await api.updateUser(token, currentUser.id, dataToSave);
      updateCurrentUser(resp.user || dataToSave);
      setEditing(false);
      alert('Profile updated.');
    } catch (err) {
      alert(`Failed to save changes: ${err.message}`);
    }
  };

  const handleUpgradePremium = async () => {
    if (!currentUser || !token) return;
    try {
      const updatedUserData = await api.upgradeToPremium(token, currentUser.id);
      updateCurrentUser(updatedUserData.user);
      setShowUpgradeModal(false);
      alert('Successfully upgraded to premium!');
    } catch (error) {
      alert(`Failed to upgrade: ${error.message}`);
    }
  };

  const toggleRsvp = async (eventId) => {
    if (!token) { alert('Please log in.'); return; }
    try {
      const eid = String(eventId);
      const currentlyGoing = myRsvpMap instanceof Map && myRsvpMap.get(eid) === true;
      if (currentlyGoing) {
        await api.cancelRsvp(token, eid);
        setMyRsvpMap(prev => {
          const next = new Map(prev);
          next.set(eid, false);
          return next;
        });
      } else {
        await api.rsvpToEvent(token, eid);
        setMyRsvpMap(prev => {
          const next = new Map(prev);
          next.set(eid, true);
          return next;
        });
      }
      // Refresh user events after RSVP change
      try { const events = await api.getUserEvents(currentUser.id); setUserEvents(events); } catch {}
    } catch (e) {
      alert(e.message || 'Failed to toggle RSVP');
    }
  };

  // Dev override removed from UI; no handler needed.

  const handleReply = (messageToReplyTo) => {
    if (!isEffectivelyPremium && messageToReplyTo.isLocked) {
        setShowUpgradeModal(true);
        return;
    }
    setRecipientUsername(messageToReplyTo.senderUsername);
    const quotedText = `> ${messageToReplyTo.text.split('\n').join('\n> ')}\n\n`;
    setNewMessageText(quotedText);
    // setReplyingTo(messageToReplyTo); // replyingTo was unused
    document.getElementById('newMessageTextarea')?.focus();
  };

  const toggleMessageReadStatus = async (messageId, currentReadStatus) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, read: !currentReadStatus } : msg
      )
    );
    // Mock API call: await api.markMessageAsReadUnread(token, messageId, !currentReadStatus);
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
      <div className="subnav" role="navigation" aria-label="Profile sections">
        <div className="tabs">
          {['profile','garage','events','settings','messages'].map(t => (
            <button key={t} className={`tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)} aria-current={activeTab===t?'page':undefined}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <UpgradeModal show={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradePremium} />
      {activeTab==='profile' && (
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
              <span className={`badge ${currentUser.premiumStatus ? 'premium' : ''}`}>{currentUser.premiumStatus ? 'Premium' : 'Free'}</span>
              {!currentUser.premiumStatus && <button onClick={handleUpgradePremium} className="btn btn-primary" style={{marginLeft:8}}>Upgrade</button>}
            </div>
          </div>
        </div>
      </Section>
      )}
      )}

      {activeTab==='profile' && (
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
      )}

      {activeTab==='garage' && (
      <Section>
        <h2>My Garage</h2>
        {(currentUser.cars || []).length === 0 ? (
          <div className="card empty">
            <div className="h3">No cars yet</div>
            <p>Add your first vehicle to your garage.</p>
            <button className="btn btn-primary" style={{marginTop:8}}>Add Vehicle</button>
          </div>
        ) : (
          <Grid cols={1} mdCols={2} lgCols={3} gap="lg">
            {(currentUser.cars || []).map((car, index) => (
              <div key={car.id || index} className="card">
                <img src={car.photos?.[0] || 'https://via.placeholder.com/300x200.png?text=No+Image'} alt={car.name} />
                <h3>{car.name}</h3>
                <p>{car.description}</p>
              </div>
            ))}
          </Grid>
        )}
      </Section>
      )}

      {activeTab==='events' && (
      <Section>
        <h2>My Events</h2>
        {userEvents.length > 0 ? (
          <Grid cols={1} mdCols={2} gap="md">
            {userEvents.map(ev => {
              const eid = String(ev.id);
              const going = myRsvpMap instanceof Map && myRsvpMap.get(eid) === true;
              return (
                <div key={eid} className="event-card">
                  <div className="title">{ev.title}</div>
                  <div className="meta">
                    <span>📅 {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}</span>
                    <span>📍 {ev.location || 'TBD'}</span>
                  </div>
                  <div className="actions">
                    <button className={`btn btn-small ${going ? 'btn-primary' : ''}`} onClick={()=> toggleRsvp(eid)}>
                      {going ? '✅ Going (Cancel)' : 'RSVP'}
                    </button>
                    <a className="btn btn-small" href={`#/events?event=${encodeURIComponent(eid)}`}>View</a>
                  </div>
                </div>
              );
            })}
          </Grid>
        ) : (
          <div className="card empty">
            <div className="h3">No upcoming events</div>
            <p>Browse events and join ones that interest you.</p>
          </div>
        )}
      </Section>
      )}

      {activeTab==='settings' && (
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
            <hr/>
            <h3>Preferences</h3>
            <h4>Notifications</h4>
            <label><input type="checkbox" checked={!!prefs.notifications?.messagesEmail} onChange={e=> setPrefs(p=> ({...p, notifications:{...(p.notifications||{}), messagesEmail:e.target.checked}}))}/> Email me for messages</label>
            <label><input type="checkbox" checked={!!prefs.notifications?.forumRepliesEmail} onChange={e=> setPrefs(p=> ({...p, notifications:{...(p.notifications||{}), forumRepliesEmail:e.target.checked}}))}/> Email me for forum replies</label>
            <label><input type="checkbox" checked={!!prefs.notifications?.eventRemindersEmail} onChange={e=> setPrefs(p=> ({...p, notifications:{...(p.notifications||{}), eventRemindersEmail:e.target.checked}}))}/> Email me event reminders</label>
            <h4>Privacy</h4>
            <label><input type="checkbox" checked={prefs.privacy?.showProfile !== false} onChange={e=> setPrefs(p=> ({...p, privacy:{...(p.privacy||{}), showProfile:e.target.checked}}))}/> Show my profile</label>
            <label><input type="checkbox" checked={!!prefs.privacy?.showEmail} onChange={e=> setPrefs(p=> ({...p, privacy:{...(p.privacy||{}), showEmail:e.target.checked}}))}/> Show my email</label>
            <label><input type="checkbox" checked={prefs.privacy?.searchable !== false} onChange={e=> setPrefs(p=> ({...p, privacy:{...(p.privacy||{}), searchable:e.target.checked}}))}/> Allow search indexing</label>
            <h4>Display & Accessibility</h4>
            <label>Theme:
              <select value={prefs.display?.theme || 'system'} onChange={e=> setPrefs(p=> ({...p, display:{...(p.display||{}), theme:e.target.value}}))}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>Text Size:
              <select value={prefs.display?.textSize || 'normal'} onChange={e=> setPrefs(p=> ({...p, display:{...(p.display||{}), textSize:e.target.value}}))}>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </label>
            <h4>Connections</h4>
            <label>Instagram: <input value={prefs.connections?.instagram || ''} onChange={e=> setPrefs(p=> ({...p, connections:{...(p.connections||{}), instagram:e.target.value}}))}/></label>
            <label>Twitter: <input value={prefs.connections?.twitter || ''} onChange={e=> setPrefs(p=> ({...p, connections:{...(p.connections||{}), twitter:e.target.value}}))}/></label>
            <label>Website: <input value={prefs.connections?.website || ''} onChange={e=> setPrefs(p=> ({...p, connections:{...(p.connections||{}), website:e.target.value}}))}/></label>
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
            <p><strong>Theme:</strong> {currentUser.preferences?.display?.theme || 'system'} • <strong>Text Size:</strong> {currentUser.preferences?.display?.textSize || 'normal'}</p>
            <p><strong>Notifications:</strong> msgs {currentUser.preferences?.notifications?.messagesEmail ? 'on' : 'off'}, replies {currentUser.preferences?.notifications?.forumRepliesEmail ? 'on' : 'off'}, events {currentUser.preferences?.notifications?.eventRemindersEmail ? 'on' : 'off'}</p>
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Settings</button>
          </div>
        )}
      </Section>
      )}

      {activeTab==='settings' && (
      <Section>
        <h2>Danger Zone</h2>
        <p>Delete your account and all associated data. This action cannot be undone.</p>
        <button className="btn btn-danger" onClick={async ()=>{
          if (!token) { alert('Please log in.'); return; }
          if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
          try { await api.deleteUser(token, currentUser.id); alert('Account deleted.'); window.location.href = '#/login'; } catch(e){ alert(e.message||'Failed to delete account'); }
        }}>Delete Account</button>
      </Section>
      )}

      {activeTab==='messages' && (
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
      )}
    </div>
  );
};

export default Profile;
