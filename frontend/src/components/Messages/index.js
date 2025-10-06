import React, { useState, useEffect } from 'react';
import './Messages.css';
import api from '../../api/client';

const Messages = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    // Legacy component not used; show empty list
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Requires auth; this placeholder UI is not wired in routing
    
    setNewMessage('');
    await loadMessages();
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="messages-feature">
      <div className="conversation-list">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              <span className="timestamp">
                {formatTime(msg.timestamp)}
                {msg.status && ` • ${msg.status}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Messages;
