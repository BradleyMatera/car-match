import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Events.css';
import mockApi from '../../api/mockApi';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await mockApi.getEvents();
        setEvents(eventsData.map(event => ({
          ...event,
          start: new Date(event.date),
          end: new Date(event.date)
        })));
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    loadEvents();
  }, []);

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
    <div className="events-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header className="events-header" style={{ marginBottom: '2rem' }}>
        <h1>Car Community Events</h1>
        <p className="page-description">
          Discover meets, shows, and rallies for car enthusiasts. 
          Browse upcoming events, connect with organizers, and join the community.
        </p>
      </header>

      <section className="upcoming-events" style={{ marginBottom: '2rem' }}>
        <h2>Upcoming Events</h2>
        <Slider {...carouselSettings}>
          {events.slice(0, 10).map(event => (
            <div key={event.id} className="carousel-card" style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              margin: '0 10px',
            }} onClick={() => setSelectedEvent(event)}>
              <img src={event.image} alt={event.title} style={{ width: '100%', height: 'auto' }} />
              <div className="carousel-content" style={{ padding: '1rem' }}>
                <h3>{event.title}</h3>
                <p className="event-date">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </p>
                <div className="event-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ marginRight: '8px' }}>📍 {event.location}</span>
                  <span style={{ marginLeft: '8px' }}>👥 {event.rsvpCount} attending</span>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      <div className="events-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        <div className="calendar-wrapper" style={{
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          backgroundColor: '#fff',
          height: 'fit-content'
        }}>
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
          <div className="event-details" style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff'
          }}>
            <img src={selectedEvent.thumbnail || selectedEvent.image} alt={selectedEvent.title} className="event-banner" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
            <h2>{selectedEvent.title}</h2>
            <div className="event-meta" style={{ marginBottom: '1rem' }}>
              <p>📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                weekday: 'long', 
                month: 'long', 
                day: 'numeric'
              })}</p>
              <p>📍 {selectedEvent.location}</p>
              <p>👥 {selectedEvent.rsvpCount} attendees</p>
            </div>
            
            <h3>Schedule</h3>
            <div className="schedule-grid" style={{ marginBottom: '1rem' }}>
              {selectedEvent.schedule.map((item, index) => (
                <div key={index} className="schedule-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="schedule-time">{item.time}</span>
                  <span className="schedule-activity">{item.activity}</span>
                </div>
              ))}
            </div>

            <section className="comments-section">
              <h3>Discussion ({selectedEvent?.comments?.length || 0})</h3>
              <div className="comment-form" style={{ marginBottom: '1rem' }}>
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  className="comment-input"
                  rows="3"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button 
                  className="comment-button"
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1574BB',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    if (!newComment.trim()) return;
                    
                    try {
                      const user = await mockApi.getCurrentUser().catch(() => {
                        alert('Please login to comment');
                        throw new Error('Not authenticated');
                      });
                      const comment = {
                        id: Date.now(),
                        user: user.name,
                        text: newComment,
                        timestamp: new Date().toISOString()
                      };
                      
                      // Update local state
                      const updatedEvent = {
                        ...selectedEvent,
                        comments: [...(selectedEvent.comments || []), comment]
                      };
                      setSelectedEvent(updatedEvent);
                      setNewComment('');
                      
                      // Update mock API
                      await mockApi.addComment(selectedEvent.id, comment);
                    } catch (error) {
                      console.error('Error posting comment:', error);
                    }
                  }}
                >
                  Post Comment
                </button>
              </div>
              <div className="comments-list">
                {(selectedEvent?.comments || []).map(comment => (
                  <div key={comment.id} className="comment-card" style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="comment-user" style={{ fontWeight: 'bold' }}>{comment.user}</span>
                      <span className="comment-date" style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text" style={{ marginTop: '0.5rem' }}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
