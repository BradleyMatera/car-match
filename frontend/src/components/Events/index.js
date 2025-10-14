import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Events.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Section from '../Section';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const assignSelectedEvent = useCallback((eventOrUpdater) => {
    setSelectedEvent((prev) => {
      const nextEvent = typeof eventOrUpdater === 'function' ? eventOrUpdater(prev) : eventOrUpdater;
      if (!nextEvent) return null;
      return {
        ...nextEvent,
        createdByUserId: nextEvent.createdByUserId ? String(nextEvent.createdByUserId) : undefined,
      };
    });
  }, []);
  // Event-specific comment composer removed in favor of forum preview + link
  const [rsvpStatus, setRsvpStatus] = useState(() => new Map());
  const { currentUser, token } = useContext(AuthContext);
  const userId = currentUser?.id ? String(currentUser.id) : undefined;
  const userRole = currentUser?.role || (currentUser?.developerOverride ? 'admin' : 'user');
  const isEventOwner = useCallback(
    (event) => Boolean(userId && event && event.createdByUserId && String(event.createdByUserId) === userId),
    [userId]
  );
  const isOwner = isEventOwner(selectedEvent);
  const canManageSelectedEvent = Boolean(isOwner || currentUser?.developerOverride || userRole === 'admin');
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '', date: '', location: '', image: '' });
  const [editingEvent, setEditingEvent] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', date: '', location: '' });
  // Editing event comments removed from UI (still supported in API)
  const [forumPreview, setForumPreview] = useState([]);
  const [bgImages, setBgImages] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const routerLocation = useLocation();
  const [flash, setFlash] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingRsvp, setPendingRsvp] = useState(null);
  const modalNameRef = useRef(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await api.getEvents();
        setEvents(eventsData.map(event => ({
          ...event,
          createdByUserId: event.createdByUserId ? String(event.createdByUserId) : undefined,
          start: event.date ? new Date(event.date) : null,
          end: event.date ? new Date(event.date) : null,
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
          const myRsvps = await api.getMyRsvps(token);
          const map = new Map();
          (myRsvps || []).forEach((rsvpEvent) => {
            const eventKey = String(rsvpEvent.eventId ?? rsvpEvent.id);
            map.set(eventKey, true);
          });
          setRsvpStatus(new Map(map));
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setFlash({ type: 'error', message: 'We had trouble loading events. Please refresh or try again shortly.' });
      }
    };
    loadEvents();
  }, [token, assignSelectedEvent]);

  const showFlash = useCallback((message, type = 'info') => {
    setFlash({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (modalNameRef.current) modalNameRef.current.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreate]);
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
        const ev = await api.getEvent(eid);
        if (ev) assignSelectedEvent(ev);
      } catch {}
    })();
  }, [routerLocation.search, assignSelectedEvent]);

  // Load a small preview of the forum thread (latest 3 posts)
  useEffect(() => {
    (async () => {
      try {
        if (!selectedEvent || !selectedEvent.threadId) { setForumPreview([]); return; }
        const data = await api.getThreadById(selectedEvent.threadId);
        const posts = Array.isArray(data?.posts) ? data.posts.slice(-3) : [];
        setForumPreview(posts);
      } catch { setForumPreview([]); }
    })();
  }, [selectedEvent, selectedEvent?.threadId]);

  const refreshEvents = async () => {
    const refreshed = await api.getEvents();
    setEvents(refreshed.map(ev => ({
      ...ev,
      createdByUserId: ev.createdByUserId ? String(ev.createdByUserId) : undefined,
      start: ev.date ? new Date(ev.date) : null,
      end: ev.date ? new Date(ev.date) : null,
    })));
    if (selectedEvent) {
      const updated = refreshed.find(e => String(e.id) === String(selectedEvent.id));
      if (updated) assignSelectedEvent(updated);
    }
  };

  const ensureEventThread = useCallback(async (event) => {
    if (!event) return null;
    if (event.threadId) return event.threadId;
    const ensured = await api.ensureEventThread(event.id);
    const threadId = ensured?.threadId;
    if (threadId) {
      setEvents((prev) => prev.map((ev) => (String(ev.id) === String(event.id) ? { ...ev, threadId } : ev)));
      assignSelectedEvent((prev) => {
        if (!prev || String(prev.id) !== String(event.id)) return prev;
        return { ...prev, threadId };
      });
    }
    return threadId;
  }, [assignSelectedEvent]);

  const ensureSelectedEventThread = useCallback(async () => {
    if (!selectedEvent) return null;
    return ensureEventThread(selectedEvent);
  }, [selectedEvent, ensureEventThread]);

  const handleRsvpToggle = async (eventId) => {
    try {
      if (!token || !currentUser) { showFlash('Please log in to RSVP.', 'info'); return; }
      const key = String(eventId);
      const targetEvent = events.find(e => String(e.id) === key);
      if (targetEvent && userId && targetEvent.createdByUserId && String(targetEvent.createdByUserId) === userId) {
        showFlash('Organizers are automatically counted for their own events.', 'info');
        return;
      }
      setPendingRsvp(key);
      const currentlyGoing = isRsvped(key);
      if (currentlyGoing) {
        await api.cancelRsvp(token, eventId);
        setRsvpStatus(prev => {
          const next = new Map(prev);
          next.set(key, false);
          return next;
        });
      } else {
        await api.rsvpToEvent(token, eventId);
        setRsvpStatus(prev => {
          const next = new Map(prev);
          next.set(key, true);
          return next;
        });
      }
      await refreshEvents();
      // Ensure selected event detail is freshest from API
      try { const ev = await api.getEvent(eventId); assignSelectedEvent(ev); } catch {}
      showFlash(currentlyGoing ? 'Your RSVP has been removed.' : 'You are marked as going!', 'success');
    } catch (error) {
      console.error('Error handling RSVP:', error);
      showFlash(error.message || 'RSVP failed. Please try again.', 'error');
    } finally {
      setPendingRsvp(null);
    }
  };

  const handleDateClick = (date) => {
    const eventForDate = events.find((event) => event?.date && date.toDateString() === new Date(event.date).toDateString());
    assignSelectedEvent(eventForDate);
  };

  const isRsvped = (id) => rsvpStatus instanceof Map && rsvpStatus.get(String(id)) === true;
  const currentBackground = useMemo(
    () => (Array.isArray(bgImages) ? bgImages.at(bgIndex) ?? '' : ''),
    [bgImages, bgIndex]
  );
  const selectedEventId = selectedEvent?.id ? String(selectedEvent.id) : undefined;
  const selectedEventRsvped = selectedEventId ? isRsvped(selectedEventId) : false;

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
      {flash && (
        <div className={`page-flash page-flash-${flash.type}`} role="status" aria-live="polite">
          <span>{flash.message}</span>
          <button
            type="button"
            className="page-flash-dismiss"
            onClick={() => setFlash(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
      <div className="events-bg" style={{ backgroundImage: `linear-gradient(rgba(8,13,23,0.72), rgba(8,13,23,0.72)), url(${currentBackground})` }} />
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
            <button className="btn" onClick={()=> setShowCreate(true)} aria-haspopup="dialog">New Event</button>
          </div>
        )}
        <h2 className="section-title">Upcoming Events</h2>
        <div className="carousel-container">
          <Slider {...carouselSettings}>
            {events.slice(0, 10).map((event) => {
              const eventId = String(event.id);
              const isMine = isEventOwner(event);
              const hasThread = Boolean(event.threadId);
              const organizerDisplay = isMine ? 'You' : event.createdByUsername || 'Unknown';
              const canEnsureThread = hasThread || isMine || currentUser?.developerOverride || userRole === 'admin';
              const rsvpLabel = isMine ? 'Organizer' : (isRsvped(eventId) ? '✅ Going' : 'RSVP');

              const handleCardClick = async () => {
                try {
                  const fresh = await api.getEvent(eventId);
                  assignSelectedEvent(fresh);
                } catch {
                  assignSelectedEvent(event);
                }
              };

              const handleDiscussionClick = async (e) => {
                e.stopPropagation();
                if (!canEnsureThread) {
                  showFlash('Only organizers or admins can start a discussion for this event.', 'info');
                  return;
                }
                try {
                  let threadId = event.threadId;
                  if (!threadId) {
                    threadId = await ensureEventThread(event);
                  }
                  if (threadId) {
                    window.location.hash = `#/forums?open=${threadId}`;
                  } else {
                    showFlash('Thread isn’t ready yet—please try again in a moment.', 'info');
                  }
                } catch (err) {
                  showFlash(err.message || 'Unable to open the discussion right now.', 'error');
                }
              };

              return (
                <div key={eventId} className="carousel-slide">
                  <div className="carousel-card" onClick={handleCardClick}>
                    <img src={event.image} alt={event.title} className="card-img" />
                    <div className="carousel-content">
                      <div className="card-header">
                        <h3>{event.title}</h3>
                        <div className="event-badge-row">
                          {isMine && <span className="event-owner-chip">Your event</span>}
                          {!hasThread && canEnsureThread && <span className="event-status-chip">No thread yet</span>}
                        </div>
                      </div>
                      <p className="event-date">
                        {event.date
                          ? new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Date TBA'}
                      </p>
                      <div className="event-meta">
                        <span>📍 {event.location || 'TBD'}</span>
                        <span>👥 {event.rsvpCount || 0} attending</span>
                      </div>
                      <div className="organizer-meta">
                        <span>Organizer: {organizerDisplay}</span>
                      </div>
                      <div className="event-actions">
                        <button className="btn btn-small" onClick={handleDiscussionClick}>
                          {hasThread ? 'View Discussion' : 'Start Discussion'}
                        </button>
                        <button
                          className={`rsvp-button small ${isRsvped(eventId) ? 'rsvp-confirmed' : ''}`}
                          disabled={isMine || pendingRsvp === eventId}
                          aria-live="polite"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRsvpToggle(eventId);
                          }}
                        >
                          {pendingRsvp === eventId ? 'Processing…' : rsvpLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Slider>
        </div>
      </Section>

      <div className="events-layout">
        <div className="calendar-wrapper">
          <Calendar
            value={new Date()}
            onChange={handleDateClick}
            tileContent={({ date }) => {
              const event = events.find(e => e.date && date.toDateString() === new Date(e.date).toDateString());
              return event ? <div className="event-marker">•</div> : null;
            }}
          />
        </div>

        {selectedEvent && (
          <div className="event-details">
            {/* Hero */}
            <div className="event-hero" style={{backgroundImage:`url(${selectedEvent.image || selectedEvent.thumbnail})`}}>
              <div className="event-hero-overlay">
                <div className="event-badges">
                  {isOwner && <span className="event-owner-chip">Your event</span>}
                  {!selectedEvent.threadId && canManageSelectedEvent && <span className="event-status-chip">No forum thread yet</span>}
                </div>
                <h2>{selectedEvent.title}</h2>
                <div className="hero-meta">
                  <span>📅 {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }) : 'Date TBA'}</span>
                  <span>📍 {selectedEvent.location || 'TBD'}</span>
                  <span>👥 {selectedEvent.rsvpCount || 0} attending</span>
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
                  <button
                    className={`rsvp-button ${selectedEventRsvped ? 'rsvp-confirmed' : ''}`}
                    disabled={isOwner}
                    onClick={() => handleRsvpToggle(selectedEvent.id)}
                  >
                    {isOwner ? 'Organizer' : (selectedEventRsvped ? '✅ Going' : 'RSVP to Event')}
                  </button>
                  {selectedEventRsvped && !isOwner && <p className="rsvp-confirmation">You are confirmed for this event!</p>}
                  {isOwner && <p className="rsvp-confirmation">Organizers are automatically listed for their events.</p>}
                </div>
                <div className="side-card">
                  <h4>Event at a Glance</h4>
                  <ul className="glance-list">
                    <li>📅 {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'Date TBA'}</li>
                    <li>📍 {selectedEvent.location || 'TBD'}</li>
                    <li>🧑‍💼 Organizer: {isOwner ? 'You' : selectedEvent.createdByUsername || 'Unknown'}</li>
                  </ul>
                </div>
                <div className="side-card">
                  <h4>Social Share</h4>
                  <div className="share-list">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedEvent.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Twitter</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Facebook</a>
                    <button className="btn" onClick={()=>{ navigator.clipboard.writeText(window.location.href); showFlash('Event link copied to your clipboard.', 'success'); }}>Copy Link</button>
                  </div>
                </div>
                <div className="side-card">
                  <h4>About Organizer</h4>
                  <p><strong>{isOwner ? 'You' : selectedEvent.createdByUsername || 'Unknown'}</strong></p>
                  {selectedEvent.threadId ? (
                    <Link to={`/forums?open=${selectedEvent.threadId}`} className="btn">Open Discussion</Link>
                  ) : canManageSelectedEvent ? (
                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          const tid = await ensureSelectedEventThread();
                          if (tid) window.location.hash = `#/forums?open=${tid}`;
                        } catch (err) {
                          showFlash(err.message || 'Unable to start a discussion right now.', 'error');
                        }
                      }}
                    >
                      Start Discussion
                    </button>
                  ) : (
                    <p className="muted">No forum discussion yet.</p>
                  )}
                </div>
                {canManageSelectedEvent && !editingEvent && (
                  <div className="side-card">
                    <h4>Manage Event</h4>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="btn btn-small" onClick={()=>{ setEditingEvent(true); setEditData({ name: selectedEvent.name, description: selectedEvent.description, date: selectedEvent.date, location: selectedEvent.location }); }}>Edit</button>
                      {!selectedEvent.threadId && (
                        <button className="btn btn-small" onClick={async ()=>{
                          try {
                            const tid = await ensureSelectedEventThread();
                            if (tid) window.location.hash = `#/forums?open=${tid}`;
                          } catch (err) {
                            showFlash(err.message || 'Unable to create a forum thread right now.', 'error');
                          }
                        }}>Create Forum Thread</button>
                      )}
                      <button className="btn btn-small btn-warning" onClick={async ()=>{
                        if (!window.confirm('Delete this event?')) return;
                        try {
                          await api.deleteEvent(token, selectedEvent.id);
                          assignSelectedEvent(null);
                          await refreshEvents();
                          showFlash('Event deleted.', 'success');
                        } catch (e){
                          showFlash(e.message || 'Failed to delete the event.', 'error');
                        }
                      }}>Delete</button>
                    </div>
                  </div>
                )}
                {canManageSelectedEvent && editingEvent && (
                  <div className="side-card">
                    <h4>Edit Event</h4>
                    <form onSubmit={async (e)=>{
                      e.preventDefault();
                      try {
                        await api.updateEvent(token, selectedEvent.id, editData);
                        setEditingEvent(false);
                        await refreshEvents();
                        const ev = await api.getEvent(selectedEvent.id);
                        assignSelectedEvent(ev);
                        showFlash('Event details updated.', 'success');
                      } catch(err){
                        showFlash(err.message || 'Failed to update the event.', 'error');
                      }
                    }}>
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
              if (!createData.name.trim() || !createData.description.trim()) {
                showFlash('Please complete the name and description before creating your event.', 'error');
                return;
              }
              if (!/^\d{4}-\d{2}-\d{2}$/.test(createData.date || '')) {
                showFlash('Dates should use the format YYYY-MM-DD.', 'error');
                return;
              }
              setIsCreating(true);
              try {
                const ev = await api.createEvent(token, createData);
                setShowCreate(false);
                setCreateData({ name:'', description:'', date:'', location:'', image:'' });
                await refreshEvents();
                const createdEvent = ev?.data ?? ev;
                if (createdEvent && createdEvent.id) {
                  setEvents(prev => {
                    const without = prev.filter(ev => String(ev.id) !== String(createdEvent.id));
                    return [
                      {
                        ...createdEvent,
                        createdByUserId: createdEvent.createdByUserId ? String(createdEvent.createdByUserId) : undefined,
                        start: createdEvent.date ? new Date(createdEvent.date) : null,
                        end: createdEvent.date ? new Date(createdEvent.date) : null,
                      },
                      ...without,
                    ];
                  });
                  assignSelectedEvent(createdEvent);
                }
                showFlash('Event created and ready to share!', 'success');
              } catch(err){
                showFlash(err.message || 'Failed to create event. Please try again.', 'error');
              } finally {
                setIsCreating(false);
              }
            }}>
              <div className="content">
                <input ref={modalNameRef} placeholder="Name" value={createData.name} onChange={e=>setCreateData(d=>({...d,name:e.target.value}))} required />
                <input placeholder="Date (YYYY-MM-DD)" value={createData.date} onChange={e=>setCreateData(d=>({...d,date:e.target.value}))} required />
                <input placeholder="Location (City, State)" value={createData.location} onChange={e=>setCreateData(d=>({...d,location:e.target.value}))} required />
                <input placeholder="Image URL (optional)" value={createData.image} onChange={e=>setCreateData(d=>({...d,image:e.target.value}))} />
                <textarea placeholder="Description" value={createData.description} onChange={e=>setCreateData(d=>({...d,description:e.target.value}))} rows={5} required />
              </div>
              <footer>
                <button type="button" className="btn" onClick={()=> setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Saving…' : 'Create Event'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
