import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Events.css';
import mockApi from '../../api/mockApi';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Section from '../Section';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState({});

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

  const handleRsvpToggle = async (eventId) => {
    try {
      const user = await mockApi.getCurrentUser().catch(() => {
        alert('Please login to RSVP');
        throw new Error('Not authenticated');
      });
      setRsvpStatus(prevStatus => {
        const isRsvped = prevStatus[eventId];
        const updatedStatus = { ...prevStatus, [eventId]: !isRsvped };
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent({
            ...selectedEvent,
            rsvpCount: isRsvped ? selectedEvent.rsvpCount - 1 : selectedEvent.rsvpCount + 1
          });
        }
        // Update mock API with RSVP status
        if (!isRsvped) {
          mockApi.rsvpToEvent(user.id, eventId);
        } else {
          mockApi.cancelRsvp(user.id, eventId);
        }
        return updatedStatus;
      });
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
            <img 
              src={selectedEvent.thumbnail || selectedEvent.image} 
              alt={selectedEvent.title} 
              className="event-banner" 
            />
            <h2>{selectedEvent.title}</h2>
            <div className="event-meta">
              <p>📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                weekday: 'long', 
                month: 'long', 
                day: 'numeric'
              })}</p>
              <p>📍 {selectedEvent.location}</p>
              <p>👥 {selectedEvent.rsvpCount} attendees</p>
            </div>
            <div className="rsvp-section">
              <button 
                className={`rsvp-button ${rsvpStatus[selectedEvent.id] ? 'rsvp-confirmed' : ''}`}
                onClick={() => handleRsvpToggle(selectedEvent.id)}
              >
                {rsvpStatus[selectedEvent.id] ? '✅ Going' : 'RSVP to Event'}
              </button>
              {rsvpStatus[selectedEvent.id] && (
                <p className="rsvp-confirmation">You are confirmed for this event!</p>
              )}
            </div>
            
            <h3>Schedule</h3>
            <div className="schedule-grid">
              {selectedEvent.schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <span className="schedule-time">{item.time}</span>
                  <span className="schedule-activity">{item.activity}</span>
                </div>
              ))}
            </div>

            <section className="comments-section">
              <h3>Discussion ({selectedEvent?.comments?.length || 0})</h3>
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
                  <div key={comment.id} className="comment-card">
                    <div className="comment-header">
                      <span className="comment-user">{comment.user}</span>
                      <span className="comment-date">
                        {new Date(comment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
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
