import React, { useContext, useEffect, useState, useCallback } from 'react';
import './messages.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';

const MessagesPage = () => {
  const { currentUser, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({ gender: '', radius: '', sortBy: 'timestamp' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [text, setText] = useState('');

  const isEffectivelyPremium = !!(currentUser?.premiumStatus || currentUser?.developerOverride);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const apiFilters = isEffectivelyPremium ? {
        filterGender: filters.gender,
        filterRadius: filters.radius,
        sortBy: filters.sortBy,
      } : {};
      const data = await api.fetchMessages(token, activeTab, apiFilters);
      setMessages(data);
    } catch (e) {
      setError(e.message || 'Failed to load messages');
    } finally { setLoading(false); }
  }, [token, activeTab, filters, isEffectivelyPremium]);

  useEffect(()=>{ if (token) loadMessages(); }, [loadMessages, token]);

  const applyFilters = () => { if (!isEffectivelyPremium && (filters.gender || filters.radius || filters.sortBy==='proximity')) return alert('Upgrade to apply filters.'); loadMessages(); };

  const send = async (e) => {
    e.preventDefault();
    if (!recipient || !text) return;
    try {
      await api.sendMessage(token, recipient, text);
      setRecipient(''); setText('');
      loadMessages();
    } catch (e) {
      alert(e.message || 'Failed to send');
    }
  };

  if (!currentUser) return <div className="messages-page">Please log in.</div>;

  return (
    <div className="messages-page">
      <h1>Messages</h1>
      <div className="tabs">
        {['inbox','unread','sent','system', ...(!isEffectivelyPremium?['locked']:[])].map(t => (
          <button key={t} className={activeTab===t?'active':''} onClick={()=>setActiveTab(t)}>{t}</button>
        ))}
      </div>
      {isEffectivelyPremium && activeTab!=='system' && (
        <div className="filters">
          <select value={filters.gender} onChange={e=>setFilters(f=>({...f, gender:e.target.value}))}>
            <option value="">Filter by gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input type="number" placeholder="Radius (mi)" value={filters.radius} onChange={e=>setFilters(f=>({...f, radius:e.target.value}))} />
          <select value={filters.sortBy} onChange={e=>setFilters(f=>({...f, sortBy:e.target.value}))}>
            <option value="timestamp">Sort by date</option>
            <option value="proximity">Sort by proximity</option>
          </select>
          <button onClick={applyFilters}>Apply</button>
        </div>
      )}

      <div className="list">
        {loading && <p>Loading…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && messages.map(m => (
          <div key={m.id} className={`row ${m.isLocked?'locked':''}`}>
            <div className="meta">{m.senderId===currentUser.id?`To: ${m.recipientUsername}`:`From: ${m.senderUsername}`}</div>
            <div className="text">{m.text}</div>
            <div className="time">{new Date(m.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form className="compose" onSubmit={send}>
        <input type="text" placeholder="Recipient username" value={recipient} onChange={e=>setRecipient(e.target.value)} />
        <textarea placeholder="Your message…" value={text} onChange={e=>setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default MessagesPage;
