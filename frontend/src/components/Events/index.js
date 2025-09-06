import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Events.css';
import mockApi from '../../api/mockApi';
import AuthContext from '../../context/AuthContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Section from '../Section';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState({});
  const { currentUser, token } = useContext(AuthContext);
  const isOwner = selectedEvent && currentUser && String(selectedEvent.createdByUserId) === String(currentUser.id);
  const canModerate = isOwner || currentUser?.developerOverride;
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '', date: '', location: '' });
  const [editingEvent, setEditingEvent] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', date: '', location: '' });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await mockApi.getEvents();
        setEvents(eventsData.map(event => ({
          ...event,
          start: new Date(event.date),
          end: new Date(event.date)
        })));
        // Preload RSVP status if logged in
        if (token) {
          const myRsvps = await mockApi.getMyRsvps(token);
          const map = {};
          myRsvps.forEach(r => { map[r.eventId] = true; });
          setRsvpStatus(map);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    loadEvents();
  }, [token]);

  const refreshEvents = async () => {
    const refreshed = await mockApi.getEvents();
    setEvents(refreshed.map(ev => ({ ...ev, start: new Date(ev.date), end: new Date(ev.date) })));
    if (selectedEvent) {
      const updated = refreshed.find(e => String(e.id) === String(selectedEvent.id));
      if (updated) setSelectedEvent(updated);
    }
  };

  const handleRsvpToggle = async (eventId) => {
    try {
      if (!token || !currentUser) { alert('Please login to RSVP'); return; }
      if (rsvpStatus[eventId]) {
        await mockApi.cancelRsvp(token, eventId);
        setRsvpStatus(prev => ({ ...prev, [eventId]: false }));
      } else {
        await mockApi.rsvpToEvent(token, eventId);
        setRsvpStatus(prev => ({ ...prev, [eventId]: true }));
      }
      await refreshEvents();
      // Ensure selected event detail is freshest from API
      try { const ev = await mockApi.getEvent(eventId); setSelectedEvent(ev); } catch {}
    } catch (error) {
      console.error('Error handling RSVP:', error);
    }
  };

  const handleDateClick = (date) => {
    const eventForDate = events.find(event => 
      date.toDateString() === new Date(event.date).toDateString()
    );
    setSelectedEvent(eventForDate);
  };

  const carouselSettings = {
    autoscroll: true,
    autoplay: true,
    autoplaySpeed: 3000,
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="events-container">
      <header className="events-header">
        <h1>Car Community Events</h1>
        <p className="page-description">
          Discover meets, shows, and rallies for car enthusiasts. 
          Browse upcoming events, connect with organizers, and join the community.
        </p>
      </header>

      <Section>
        {currentUser && (
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
            <button className="btn" onClick={()=> setShowCreate(s=>!s)}>{showCreate? 'Close' : 'New Event'}</button>
          </div>
        )}
        {showCreate && (
          <form className="event-form" onSubmit={async (e)=>{e.preventDefault(); try { await mockApi.createEvent(token, createData); setShowCreate(false); setCreateData({name:'',description:'',date:'',location:''}); await refreshEvents(); } catch(err){ alert(err.message || 'Failed to create event'); }}}>
            <input placeholder="Name" value={createData.name} onChange={e=>setCreateData(d=>({...d,name:e.target.value}))} required />
            <input placeholder="Date (YYYY-MM-DD)" value={createData.date} onChange={e=>setCreateData(d=>({...d,date:e.target.value}))} required />
            <input placeholder="Location" value={createData.location} onChange={e=>setCreateData(d=>({...d,location:e.target.value}))} required />
            <textarea placeholder="Description" value={createData.description} onChange={e=>setCreateData(d=>({...d,description:e.target.value}))} required />
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        )}
        <h2 className="section-title">Upcoming Events</h2>
        <div className="carousel-container">
          <Slider {...carouselSettings}>
            {events.slice(0, 10).map(event => (
              <div key={event.id} className="carousel-slide">
                <div className="carousel-card" onClick={() => setSelectedEvent(event)}>
                  <img src={event.image} alt={event.title} className="card-img" />
                  <div className="carousel-content">
                    <h3>{event.title}</h3>
                    <p className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                    <div className="event-meta">
                      <span>📍 {event.location}</span>
                      <span>👥 {event.rsvpCount} attending</span>
                    </div>
                    <div className="event-meta" style={{marginTop:6}}>
                      <span>Organizer: {event.createdByUsername || 'Unknown'}</span>
                    </div>
                    {event.threadId && (
                      <div style={{marginTop:8}}>
                        <button className="btn btn-small" onClick={(e)=>{ e.stopPropagation(); window.location.hash = `#/forums?open=${event.threadId}`; }}>View Discussion</button>
                      </div>
                    )}
                    <button 
                      className={`rsvp-button small ${rsvpStatus[event.id] ? 'rsvp-confirmed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRsvpToggle(event.id);
                      }}
                    >
                      {rsvpStatus[event.id] ? '✅ Going' : 'RSVP'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </Section>

      <div className="events-layout">
        <div className="calendar-wrapper">
          <Calendar
            value={new Date()}
            onChange={handleDateClick}
            tileContent={({ date }) => {
              const event = events.find(e => 
                date.toDateString() === new Date(e.date).toDateString()
              );
              return event ? <div className="event-marker">•</div> : null;
            }}
          />
        </div>

        {selectedEvent && (
          <div className="event-details">
            {/* Hero */}
            <div className="event-hero" style={{backgroundImage:`url(${selectedEvent.image || selectedEvent.thumbnail})`}}>
              <div className="event-hero-overlay">
                <h2>{selectedEvent.title}</h2>
                <div className="hero-meta">
                  <span>📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</span>
                  <span>📍 {selectedEvent.location}</span>
                  <span>👥 {selectedEvent.rsvpCount} attending</span>
                </div>
              </div>
            </div>

            <div className="event-grid">
              {/* Main column */}
              <div className="event-main">
                <div className="event-gallery">
                  <img src={selectedEvent.image || selectedEvent.thumbnail} alt={selectedEvent.title} />
                </div>
                <h3>About this Event</h3>
                <p>{selectedEvent.description || 'Details coming soon.'}</p>
                {/* Comments */}
                {Array.isArray(selectedEvent.comments) && selectedEvent.comments.length > 0 && (
                  <section className="comments-section">
                    <h3>Discussion ({selectedEvent?.comments?.length || 0})</h3>
                    <div className="comments-list">
                      {(selectedEvent?.comments || []).map(comment => {
                        const canEdit = currentUser && (comment.user === currentUser.username || canModerate || String(comment.userId) === String(currentUser.id));
                        const isEditing = editingCommentId === comment.id;
                        return (
                          <div key={comment.id} className="comment-card">
                            <div className="comment-header">
                              <span className="comment-user">{comment.user}</span>
                              <span className="comment-date">{new Date(comment.timestamp).toLocaleDateString()}</span>
                            </div>
                            {!isEditing ? (
                              <p className="comment-text">{comment.text}</p>
                            ) : (
                              <textarea value={editCommentText} onChange={e=>setEditCommentText(e.target.value)} rows={3} />
                            )}
                            {canEdit && (
                              <div style={{display:'flex',gap:8,marginTop:6}}>
                                {!isEditing ? (
                                  <button className="btn btn-small" onClick={()=>{ setEditingCommentId(comment.id); setEditCommentText(comment.text); }}>Edit</button>
                                ) : (
                                  <>
                                    <button className="btn btn-small btn-primary" onClick={async ()=>{ try { await mockApi.editEventComment(token, selectedEvent.id, comment.id, editCommentText.trim()); setEditingCommentId(null); setEditCommentText(''); await refreshEvents(); const ev = await mockApi.getEvent(selectedEvent.id); setSelectedEvent(ev); } catch(e){ alert(e.message||'Failed to save'); } }}>Save</button>
                                    <button className="btn btn-small" onClick={()=>{ setEditingCommentId(null); setEditCommentText(''); }}>Cancel</button>
                                  </>
                                )}
                                <button className="btn btn-small btn-warning" onClick={async ()=>{ if (!window.confirm('Delete this comment?')) return; try { await mockApi.deleteEventComment(token, selectedEvent.id, comment.id); await refreshEvents(); const ev = await mockApi.getEvent(selectedEvent.id); setSelectedEvent(ev); } catch(e){ alert(e.message||'Failed to delete'); } }}>Delete</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
                {token && (
                  <section className="comments-section">
                    <h3>Add a comment</h3>
                    <div className="comment-form">
                      <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Add your comment..." className="comment-input" rows={3} />
                      <button className="comment-button" onClick={async ()=>{ if (!newComment.trim()) return; try { await mockApi.addEventComment(token, selectedEvent.id, newComment.trim()); const ev = await mockApi.getEvent(selectedEvent.id); setSelectedEvent(ev); setNewComment(''); } catch(e){ alert(e.message||'Failed to add comment'); } }}>Post Comment</button>
                    </div>
                  </section>
                )}
                {/* Map */}
                {selectedEvent.location && (
                  <div style={{marginTop:16}}>
                    <h3>Location</h3>
                    <div className="map-embed"><iframe title="map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&output=embed`}></iframe></div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="event-side">
                <div className="side-card">
                  <button className={`rsvp-button ${rsvpStatus[selectedEvent.id] ? 'rsvp-confirmed' : ''}`} onClick={()=> handleRsvpToggle(selectedEvent.id)}>
                    {rsvpStatus[selectedEvent.id] ? '✅ Going' : 'RSVP to Event'}
                  </button>
                  {rsvpStatus[selectedEvent.id] && <p className="rsvp-confirmation">You are confirmed for this event!</p>}
                </div>
                <div className="side-card">
                  <h4>Event at a Glance</h4>
                  <ul className="glance-list">
                    <li>📅 {new Date(selectedEvent.date).toLocaleDateString()}</li>
                    <li>📍 {selectedEvent.location}</li>
                    <li>🧑‍💼 Organizer: {selectedEvent.createdByUsername || 'Unknown'}</li>
                  </ul>
                </div>
                <div className="side-card">
                  <h4>Social Share</h4>
                  <div className="share-list">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedEvent.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Twitter</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Facebook</a>
                    <button className="btn" onClick={()=>{ navigator.clipboard.writeText(window.location.href); alert('Link copied'); }}>Copy Link</button>
                  </div>
                </div>
                <div className="side-card">
                  <h4>About Organizer</h4>
                  <p><strong>{selectedEvent.createdByUsername || 'Unknown'}</strong></p>
                  {selectedEvent.threadId && <Link to={`/forums?open=${selectedEvent.threadId}`} className="btn">View Discussion</Link>}
                </div>
                {canModerate && !editingEvent && (
                  <div className="side-card">
                    <h4>Manage Event</h4>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="btn btn-small" onClick={()=>{ setEditingEvent(true); setEditData({ name: selectedEvent.name, description: selectedEvent.description, date: selectedEvent.date, location: selectedEvent.location }); }}>Edit</button>
                      <button className="btn btn-small btn-warning" onClick={async ()=>{ if (!window.confirm('Delete this event?')) return; try { await mockApi.deleteEvent(token, selectedEvent.id); setSelectedEvent(null); await refreshEvents(); } catch (e){ alert(e.message||'Failed to delete'); } }}>Delete</button>
                    </div>
                  </div>
                )}
                {canModerate && editingEvent && (
                  <div className="side-card">
                    <h4>Edit Event</h4>
                    <form onSubmit={async (e)=>{ e.preventDefault(); try { await mockApi.updateEvent(token, selectedEvent.id, editData); setEditingEvent(false); await refreshEvents(); const ev = await mockApi.getEvent(selectedEvent.id); setSelectedEvent(ev); } catch(err){ alert(err.message||'Failed to update'); } }}>
                      <input placeholder="Name" value={editData.name} onChange={e=>setEditData(d=>({...d,name:e.target.value}))} required />
                      <input placeholder="Date (YYYY-MM-DD)" value={editData.date} onChange={e=>setEditData(d=>({...d,date:e.target.value}))} required />
                      <input placeholder="Location" value={editData.location} onChange={e=>setEditData(d=>({...d,location:e.target.value}))} required />
                      <textarea placeholder="Description" value={editData.description} onChange={e=>setEditData(d=>({...d,description:e.target.value}))} rows={4} />
                      <div style={{display:'flex',gap:8}}>
                        <button type="submit" className="btn btn-primary">Save</button>
                        <button type="button" className="btn" onClick={()=> setEditingEvent(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </aside>
            </div>
            
            {Array.isArray(selectedEvent.schedule) && selectedEvent.schedule.length > 0 && (
              <>
                <h3>Schedule</h3>
                <div className="schedule-grid">
                  {selectedEvent.schedule.map((item, index) => (
                    <div key={index} className="schedule-item">
                      <span className="schedule-time">{item.time}</span>
                      <span className="schedule-activity">{item.activity}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Array.isArray(selectedEvent.comments) && selectedEvent.comments.length > 0 && (
              <section className="comments-section">
                <h3>Discussion ({selectedEvent?.comments?.length || 0})</h3>
                <div className="comments-list">
                  {(selectedEvent?.comments || []).map(comment => {
                    const canEdit = currentUser && (comment.user === currentUser.username || canModerate || String(comment.userId) === String(currentUser.id));
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header">
                          <span className="comment-user">{comment.user}</span>
                          <span className="comment-date">{new Date(comment.timestamp).toLocaleDateString()}</span>
                        </div>
                        {!isEditing ? (
                          <p className="comment-text">{comment.text}</p>
                        ) : (
                          <textarea value={editCommentText} onChange={e=>setEditCommentText(e.target.value)} rows={3} />
                        )}
                        {canEdit && (
                          <div style={{display:'flex',gap:8,marginTop:6}}>
                            {!isEditing ? (
                              <button className="btn btn-small" onClick={()=>{ setEditingCommentId(comment.id); setEditCommentText(comment.text); }}>Edit</button>
                            ) : (
                              <>
                                <button className="btn btn-small btn-primary" onClick={async ()=>{ try { await mockApi.editEventComment(token, selectedEvent.id, comment.id, editCommentText.trim()); setEditingCommentId(null); setEditCommentText(''); await refreshEvents(); } catch(e){ alert(e.message||'Failed to save'); } }}>Save</button>
                                <button className="btn btn-small" onClick={()=>{ setEditingCommentId(null); setEditCommentText(''); }}>Cancel</button>
                              </>
                            )}
                            <button className="btn btn-small btn-warning" onClick={async ()=>{ if (!window.confirm('Delete this comment?')) return; try { await mockApi.deleteEventComment(token, selectedEvent.id, comment.id); await refreshEvents(); } catch(e){ alert(e.message||'Failed to delete'); } }}>Delete</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {token && (
              <section className="comments-section">
                <h3>Add a comment</h3>
                <div className="comment-form">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your comment..."
                    className="comment-input"
                    rows="3"
                  />
                  <button 
                    className="comment-button"
                    onClick={async () => {
                      if (!newComment.trim()) return;
                      try {
                        await mockApi.addEventComment(token, selectedEvent.id, newComment.trim());
                        const updated = await mockApi.getEvent(selectedEvent.id);
                        setSelectedEvent(updated);
                        setNewComment('');
                      } catch (e) { alert(e.message || 'Failed to add comment'); }
                    }}
                  >
                    Post Comment
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
