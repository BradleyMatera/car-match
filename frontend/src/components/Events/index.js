import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
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
  // Event-specific comment composer removed in favor of forum preview + link
  const [rsvpStatus, setRsvpStatus] = useState({});
  const { currentUser, token } = useContext(AuthContext);
  const isOwner = selectedEvent && currentUser && String(selectedEvent.createdByUserId) === String(currentUser.id);
  const canModerate = isOwner || currentUser?.developerOverride;
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '', date: '', location: '' });
  const [editingEvent, setEditingEvent] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', date: '', location: '' });
  // Editing event comments removed from UI (still supported in API)
  const [forumPreview, setForumPreview] = useState([]);
  const [bgImages, setBgImages] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const routerLocation = useLocation();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await mockApi.getEvents();
        setEvents(eventsData.map(event => ({
          ...event,
          start: new Date(event.date),
          end: new Date(event.date)
        })));
        const imgs = Array.from(new Set(eventsData.map(e => e.image || e.thumbnail).filter(Boolean)));
        if (imgs.length === 0) {
          imgs.push(
            'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'
          );
        }
        setBgImages(imgs);
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

  useEffect(() => {
    if (!bgImages.length) return;
    const id = setInterval(() => setBgIndex(i => (i + 1) % bgImages.length), 8000);
    return () => clearInterval(id);
  }, [bgImages]);

  // If URL has ?event=<id>, open that event after events load
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const eid = params.get('event');
    if (!eid) return;
    (async () => {
      try {
        const ev = await mockApi.getEvent(eid);
        if (ev) setSelectedEvent(ev);
      } catch {}
    })();
  }, [routerLocation.search]);

  // Load a small preview of the forum thread (latest 3 posts)
  useEffect(() => {
    (async () => {
      try {
        if (!selectedEvent || !selectedEvent.threadId) { setForumPreview([]); return; }
        const data = await mockApi.getThreadById(selectedEvent.threadId);
        const posts = Array.isArray(data?.posts) ? data.posts.slice(-3) : [];
        setForumPreview(posts);
      } catch { setForumPreview([]); }
    })();
  }, [selectedEvent, selectedEvent?.threadId]);

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
      <div className="events-bg" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${bgImages[bgIndex] || ''})` }} />
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
            <button className="btn" onClick={()=> setShowCreate(true)}>New Event</button>
          </div>
        )}
        <h2 className="section-title">Upcoming Events</h2>
        <div className="carousel-container">
          <Slider {...carouselSettings}>
            {events.slice(0, 10).map(event => (
              <div key={event.id} className="carousel-slide">
                <div className="carousel-card" onClick={async () => {
                  try { const ev = await mockApi.getEvent(event.id); setSelectedEvent(ev); } catch { setSelectedEvent(event); }
                }}>
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
                    <div style={{marginTop:8}}>
                      <button className="btn btn-small" onClick={async (e)=>{ 
                        e.stopPropagation(); 
                        try { 
                          const ensured = event.threadId ? null : await mockApi.ensureEventThread(event.id);
                          const tid = (event.threadId) || ensured?.threadId;
                          if (tid) window.location.hash = `#/forums?open=${tid}`;
                          else alert('Thread not ready; try again in a moment.');
                        } catch { alert('Unable to open discussion right now.'); }
                      }}>View Discussion</button>
                    </div>
                    <button 
                      className={`rsvp-button small ${rsvpStatus[String(event.id)] ? 'rsvp-confirmed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRsvpToggle(event.id);
                      }}
                    >
                      {rsvpStatus[String(event.id)] ? '✅ Going' : 'RSVP'}
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
                {/* Forum Discussion preview only (no event comments duplicate) */}
                {selectedEvent.threadId && (
                  <section className="comments-section" style={{marginTop:16}}>
                    <h3>Forum Discussion (latest)</h3>
                    {forumPreview.length === 0 ? (
                      <p>No forum replies yet. Be the first to discuss in Forums.</p>
                    ) : (
                      <div className="comments-list">
                    {forumPreview.map(fp => (
                      <div key={fp._id || fp.id} className="comment-card">
                        <div className="comment-header">
                          <span className="comment-user">{fp.authorUsername || 'user'}</span>
                          <span className="comment-date">{new Date(fp.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="comment-text">{fp.body}</p>
                        <div style={{marginTop:6}}>
                          <Link to={`/forums?open=${selectedEvent.threadId}&post=${fp._id || fp.id}`} className="btn btn-small">Go to post</Link>
                        </div>
                      </div>
                    ))}
                      </div>
                    )}
                    <div style={{marginTop:8}}>
                      <Link to={`/forums?open=${selectedEvent.threadId}`} className="btn">Open Full Thread</Link>
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
            
          </div>
        )}
      </div>
      {showCreate && (
        <div className="modal-backdrop" onClick={(e)=>{ if (e.target.classList.contains('modal-backdrop')) setShowCreate(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <header>
              <span>Create Event</span>
              <button className="btn" onClick={()=> setShowCreate(false)}>✕</button>
            </header>
            <form onSubmit={async (e)=>{
              e.preventDefault();
              try {
                const res = await mockApi.createEvent(token, createData);
                const ev = res?.data || res;
                setShowCreate(false);
                setCreateData({ name:'', description:'', date:'', location:'', image:'' });
                await refreshEvents();
                if (ev && ev.id) {
                  try { const fetched = await mockApi.getEvent(ev.id); setSelectedEvent(fetched); } catch { setSelectedEvent(ev); }
                }
              } catch(err){ alert(err.message || 'Failed to create event'); }
            }}>
              <div className="content">
                <input placeholder="Name" value={createData.name} onChange={e=>setCreateData(d=>({...d,name:e.target.value}))} required />
                <input placeholder="Date (YYYY-MM-DD)" value={createData.date} onChange={e=>setCreateData(d=>({...d,date:e.target.value}))} required />
                <input placeholder="Location (City, State)" value={createData.location} onChange={e=>setCreateData(d=>({...d,location:e.target.value}))} required />
                <input placeholder="Image URL (optional)" value={createData.image} onChange={e=>setCreateData(d=>({...d,image:e.target.value}))} />
                <textarea placeholder="Description" value={createData.description} onChange={e=>setCreateData(d=>({...d,description:e.target.value}))} rows={5} required />
              </div>
              <footer>
                <button type="button" className="btn" onClick={()=> setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Event</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
