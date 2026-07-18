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
import { applySEO } from '../../utils/seo';
import { toast } from '../../utils/toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
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
  const routerLocation = useLocation();
  const [flash, setFlash] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingRsvp, setPendingRsvp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalNameRef = useRef(null);

  useEffect(() => {
    return applySEO({
      title: 'Events',
      description: 'Discover upcoming car meets, track days, and community drives. Create your own event and manage RSVPs in real time with organizer-only controls.',
      canonical: 'https://bradleymatera.github.io/car-match/#/events',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'CarMatch Events',
        url: 'https://bradleymatera.github.io/car-match/#/events',
        description: 'A curated list of events for automotive enthusiasts managed by the CarMatch community.'
      }
    });
  }, []);

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
      } finally {
        setLoadingEvents(false);
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
    if (!showCreate && !editingEvent && confirmDeleteId === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowCreate(false);
        setEditingEvent(false);
        setConfirmDeleteId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCreate, editingEvent, confirmDeleteId]);

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

  const refreshEvents = useCallback(async () => {
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
  }, [selectedEvent, assignSelectedEvent]);

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
  const selectedEventId = selectedEvent?.id ? String(selectedEvent.id) : undefined;
  const selectedEventRsvped = selectedEventId ? isRsvped(selectedEventId) : false;

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return events.filter((event) => {
      const matchesSearch = !searchQuery.trim() ||
        (event.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchesSearch) return false;
      if (dateFilter === 'all') return true;
      if (!event.date) return false;
      const d = new Date(event.date);
      if (dateFilter === 'upcoming') return d >= now;
      if (dateFilter === 'week') return d >= startOfWeek && d < endOfWeek;
      if (dateFilter === 'month') return d >= startOfMonth && d < endOfMonth;
      return true;
    });
  }, [events, searchQuery, dateFilter]);

  const eventDates = useMemo(() => {
    const set = new Set();
    events.forEach((e) => { if (e.date) set.add(new Date(e.date).toDateString()); });
    return set;
  }, [events]);

  const handleShare = useCallback(async (event) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/events?event=${event.id}`;
    const shareData = {
      title: event.title || 'CarMatch Event',
      text: event.description || `Check out this event: ${event.title}`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Event shared!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Event link copied to your clipboard!');
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      toast.error('Unable to share this event right now.');
    }
  }, []);

  const handleDeleteEvent = async (eventId) => {
    setIsDeleting(true);
    try {
      await api.deleteEvent(token, eventId);
      assignSelectedEvent(null);
      setConfirmDeleteId(null);
      await refreshEvents();
      toast.success('Event deleted.');
    } catch (e) {
      toast.error(e.message || 'Failed to delete the event.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageFile = useCallback((file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter((prev) => ({ ...prev, image: reader.result }));
      toast.success('Image ready to upload.');
    };
    reader.onerror = () => toast.error('Could not read that image file.');
    reader.readAsDataURL(file);
  }, []);

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
      <div className="events-bg" />
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
        <div className="events-filters">
          <input
            type="search"
            className="events-search-input"
            placeholder="Search events by title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search events by title"
          />
          <select
            className="events-date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter events by date range"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        {loadingEvents && events.length === 0 && (
          <div className="events-skeleton" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-img" />
                <div className="skeleton-line skeleton-line-title" />
                <div className="skeleton-line skeleton-line-short" />
                <div className="skeleton-line skeleton-line-short" />
              </div>
            ))}
          </div>
        )}
        {!loadingEvents && events.length === 0 && (
          <div className="events-empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No events yet. Be the first to create one!</h3>
            {currentUser ? (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Event</button>
            ) : (
              <p className="muted">Log in to create the first event.</p>
            )}
          </div>
        )}
        {!loadingEvents && events.length > 0 && filteredEvents.length === 0 && (
          <div className="events-empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No events match your search.</h3>
            <button className="btn" onClick={() => { setSearchQuery(''); setDateFilter('all'); }}>Clear filters</button>
          </div>
        )}
        <div className="carousel-container">
          <Slider {...carouselSettings}>
            {filteredEvents.slice(0, 10).map((event) => {
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
            tileClassName={({ date }) => eventDates.has(date.toDateString()) ? 'has-events' : null}
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
                    disabled={isOwner || pendingRsvp === selectedEventId}
                    onClick={() => handleRsvpToggle(selectedEvent.id)}
                  >
                    {pendingRsvp === selectedEventId ? 'Updating…' : (isOwner ? 'Organizer' : (selectedEventRsvped ? '✅ Going' : 'RSVP to Event'))}
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
                    <button className="btn" onClick={() => handleShare(selectedEvent)}>Share Event</button>
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
                      <button className="btn btn-small" onClick={()=>{ setEditingEvent(true); setEditData({ name: selectedEvent.name, description: selectedEvent.description, date: selectedEvent.date, location: selectedEvent.location, image: selectedEvent.image || '' }); }}>Edit</button>
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
                      {confirmDeleteId === String(selectedEvent.id) ? (
                        <div className="delete-confirm-inline">
                          <span>Delete this event?</span>
                          <button
                            className="btn btn-small btn-warning"
                            disabled={isDeleting}
                            onClick={() => handleDeleteEvent(selectedEvent.id)}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                          <button
                            className="btn btn-small"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-small btn-warning"
                          onClick={() => setConfirmDeleteId(String(selectedEvent.id))}
                        >Delete</button>
                      )}
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
                      <label className="modal-file-label">Event image</label>
                      <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0], setEditData)} />
                      {editData.image && <img src={editData.image} alt="Preview" className="modal-image-preview" />}
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
                <label className="modal-file-label">Event image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0], setCreateData)} />
                {createData.image && <img src={createData.image} alt="Preview" className="modal-image-preview" />}
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
