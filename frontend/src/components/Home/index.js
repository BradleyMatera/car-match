import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import api from '../../api/client';
import { applySEO } from '../../utils/seo';

// Simple count-up hook: animates a number from 0 -> target over ~1s once mounted.
const useCountUp = (target, duration = 1000) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const final = Number(target) || 0;
    if (final <= 0) { setValue(0); return; }
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // easeOutCubic for a nice finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * final));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return value;
};

// Small presentational wrapper so each stat animates independently.
const StatCard = ({ value, label, icon }) => {
  const animated = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-num">{animated.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

const formatEventDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const QUICK_ACTIONS = [
  { to: '/events', label: 'Browse Events', desc: 'Find meets & shows near you', icon: '📅' },
  { to: '/forums', label: 'Join Discussion', desc: 'Talk cars with the community', icon: '💬' },
  { to: '/businesses', label: 'Find Shops', desc: 'Trusted builders & services', icon: '🔧' },
  { to: '/marketplace', label: 'List Parts', desc: 'Buy & sell parts locally', icon: '🏷️' },
];

const Home = () => {
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0, events: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [latestThreads, setLatestThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);

  useEffect(() => {
    return applySEO({
      title: 'Discover',
      description: 'CarMatch helps automotive enthusiasts connect through curated events, discussion forums, and personalized profiles. Explore the community and plan your next drive.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CarMatch',
        url: 'https://bradleymatera.github.io/car-match/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://bradleymatera.github.io/car-match/#/events?query={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      // Site snapshot
      setStatsLoading(true);
      try {
        const s = await api.getSiteStats();
        setStats(s || { users: 0, threads: 0, posts: 0, events: 0 });
        setStatsError(null);
      } catch (e) {
        setStatsError('Unable to load community stats right now.');
      } finally {
        setStatsLoading(false);
      }

      // Latest threads: pull small page from each category and sort by lastPostAt
      setThreadsLoading(true);
      try {
        const cats = await api.getForumCategories();
        const all = await Promise.all((cats || []).map(async (cat) => ({
          cat,
          resp: await api.getThreadsByCategory(cat.id, { page: 1, pageSize: 5 })
        })));
        const flat = [];
        all.forEach(({ cat, resp }) => {
          const items = Array.isArray(resp) ? resp : resp?.items || [];
          items.forEach((thread) => flat.push({
            ...thread,
            categoryId: cat?.id,
            categoryName: cat?.name
          }));
        });
        flat.sort((a, b) => new Date(b.lastPostAt || b.createdAt) - new Date(a.lastPostAt || a.createdAt));
        setLatestThreads(flat.slice(0, 6));
        setThreadsError(null);
      } catch (e) {
        setThreadsError('Unable to load latest discussions right now.');
        setLatestThreads([]);
      } finally {
        setThreadsLoading(false);
      }

      // Upcoming events
      setEventsLoading(true);
      try {
        const evs = await api.getEvents();
        const withDates = (evs || [])
          .map((e) => ({ ...e, dateObj: new Date(e.date) }))
          .filter((e) => !isNaN(e.dateObj));
        withDates.sort((a, b) => a.dateObj - b.dateObj);
        setEvents(withDates);
        setEventsError(null);
      } catch (e) {
        setEventsError('Unable to load upcoming events right now.');
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }

      // Recent marketplace listings (for activity feed)
      setListingsLoading(true);
      try {
        const result = await api.getListings({ pageSize: 4 });
        setListings(result.data || result.listings || result || []);
      } catch (e) {
        setListings([]);
      } finally {
        setListingsLoading(false);
      }

      // Recent businesses (for activity feed)
      setBusinessesLoading(true);
      try {
        const result = await api.getBusinesses({ pageSize: 4 });
        setBusinesses(result.data || result.businesses || result || []);
      } catch (e) {
        setBusinesses([]);
      } finally {
        setBusinessesLoading(false);
      }
    })();
  }, []);

  // Upcoming = events with date >= now; featured = first few upcoming
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => e.dateObj.getTime() >= now);
  }, [events]);

  const featuredEvents = useMemo(() => upcomingEvents.slice(0, 4), [upcomingEvents]);

  // Trending = threads sorted by reply count (most active), fallback to lastPostAt
  const trendingThreads = useMemo(() => {
    return [...latestThreads].sort((a, b) => {
      const aScore = (Number(a.replies) || 0) + (a.pinned ? 1000 : 0);
      const bScore = (Number(b.replies) || 0) + (b.pinned ? 1000 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.lastPostAt || b.createdAt) - new Date(a.lastPostAt || a.createdAt);
    }).slice(0, 5);
  }, [latestThreads]);

  // Unified recent activity feed
  const activityFeed = useMemo(() => {
    const items = [];
    (latestThreads || []).slice(0, 4).forEach((t) => {
      items.push({
        type: 'forum',
        title: t.title,
        meta: `${t.categoryName || 'Forum'} • ${t.replies || 0} replies`,
        time: t.lastPostAt || t.createdAt,
        to: `/forums?open=${t.id || t._id}`,
        icon: '💬',
      });
    });
    (upcomingEvents || []).slice(0, 3).forEach((e) => {
      const d = formatEventDate(e.date);
      items.push({
        type: 'event',
        title: e.title || e.name || 'New event',
        meta: d ? `${d.full} • ${e.location || 'TBA'}` : (e.location || 'New event'),
        time: e.date,
        to: `/events`,
        icon: '📅',
      });
    });
    (listings || []).slice(0, 3).forEach((l) => {
      items.push({
        type: 'listing',
        title: l.title || 'New listing',
        meta: l.price != null ? `$${l.price}` : (l.category || 'Parts'),
        time: l.createdAt || l.updatedAt,
        to: '/marketplace',
        icon: '🏷️',
      });
    });
    (businesses || []).slice(0, 2).forEach((b) => {
      items.push({
        type: 'business',
        title: b.name || 'New shop',
        meta: b.category || (b.city ? `${b.city}, ${b.state || ''}` : 'Shop'),
        time: b.createdAt || b.updatedAt,
        to: '/businesses',
        icon: '🔧',
      });
    });
    items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    return items.slice(0, 8);
  }, [latestThreads, upcomingEvents, listings, businesses]);

  return (
    <div className="homepage-container">
      <div
        className="page-bg home-bg"
        style={{
          background: 'linear-gradient(135deg, #0a0a0f 0%, #14141f 50%, #1c1c2e 100%)'
        }}
      />

      {/* Compact Hero */}
      <section className="hero hero-compact">
        <div className="hero-content">
          <span className="hero-eyebrow">CarMatch Community</span>
          <h1>Discover Your Next Drive</h1>
          <p className="hero-text">
            Live events, trending discussions, and a community that gets your obsession.
          </p>
          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary hero-cta">Browse Events</Link>
            <Link to="/forums" className="btn btn-ghost hero-cta-secondary">Join the Forum</Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-section quick-actions-section">
        <div className="home-container">
          <div className="quick-actions-grid">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to} className="quick-action-card">
                <span className="quick-action-icon">{action.icon}</span>
                <span className="quick-action-label">{action.label}</span>
                <span className="quick-action-desc">{action.desc}</span>
                <span className="quick-action-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="home-section stats-section">
        <div className="home-container">
          <div className="section-header-row">
            <h2 className="section-title">Community Pulse</h2>
          </div>
          {statsError ? (
            <p className="section-error">{statsError}</p>
          ) : statsLoading ? (
            <div className="stats-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="stat-card skeleton-card">
                  <div className="skeleton skeleton-line skeleton-line-lg" />
                  <div className="skeleton skeleton-line" />
                </div>
              ))}
            </div>
          ) : (
            <div className="stats-grid">
              <StatCard value={stats.users} label="Members" icon="👥" />
              <StatCard value={stats.threads} label="Threads" icon="💬" />
              <StatCard value={stats.posts} label="Posts" icon="✍️" />
              <StatCard value={stats.events} label="Events" icon="🏁" />
            </div>
          )}
        </div>
      </section>

      {/* Live Event Feed */}
      <section className="home-section events-feed-section">
        <div className="home-container">
          <div className="section-header-row">
            <h2 className="section-title">Upcoming Events</h2>
            <Link to="/events" className="view-all-link">View All →</Link>
          </div>
          {eventsError ? (
            <p className="section-error">{eventsError}</p>
          ) : eventsLoading ? (
            <div className="event-feed-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="event-card skeleton-card">
                  <div className="event-card-image skeleton skeleton-block" />
                  <div className="event-card-body">
                    <div className="skeleton skeleton-line skeleton-line-md" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">🏁</span>
              <p>No upcoming events scheduled yet.</p>
              <Link to="/events" className="btn btn-primary">Browse All Events</Link>
            </div>
          ) : (
            <div className="event-feed-grid">
              {upcomingEvents.slice(0, 6).map((ev) => {
                const d = formatEventDate(ev.date);
                const img = ev.image || ev.thumbnail;
                return (
                  <div key={ev.id} className="event-card">
                    <Link to="/events" className="event-card-media">
                      {img ? (
                        <img src={img} alt={ev.title || ev.name || 'Event'} className="event-card-image" loading="lazy" />
                      ) : (
                        <div className="event-card-image event-card-image-fallback">
                          <span className="event-card-emoji">🏎️</span>
                        </div>
                      )}
                      {d && (
                        <div className="event-date-badge">
                          <span className="event-date-month">{d.month}</span>
                          <span className="event-date-day">{d.day}</span>
                        </div>
                      )}
                    </Link>
                    <div className="event-card-body">
                      <h3 className="event-card-title">
                        <Link to="/events">{ev.title || ev.name}</Link>
                      </h3>
                      <div className="event-card-meta">
                        {d && <span className="event-meta-item">📅 {d.full}</span>}
                        {ev.location && <span className="event-meta-item">📍 {ev.location}</span>}
                      </div>
                      <div className="event-card-footer">
                        <span className="event-rsvp-count">{ev.rsvpCount || 0} going</span>
                        <Link
                          to={ev.threadId ? `/forums?open=${ev.threadId}` : '/forums'}
                          className="btn btn-sm btn-discuss"
                        >
                          Discuss →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="home-section featured-section">
          <div className="home-container">
            <div className="section-header-row">
              <h2 className="section-title">Featured</h2>
              <Link to="/events" className="view-all-link">All Events →</Link>
            </div>
            <div className="featured-grid">
              {featuredEvents.map((ev) => {
                const d = formatEventDate(ev.date);
                const img = ev.image || ev.thumbnail;
                return (
                  <Link key={ev.id} to="/events" className="featured-card">
                    {img ? (
                      <img src={img} alt={ev.title || ev.name || 'Event'} className="featured-card-image" loading="lazy" />
                    ) : (
                      <div className="featured-card-image featured-card-image-fallback">
                        <span className="featured-card-emoji">🏁</span>
                      </div>
                    )}
                    <div className="featured-card-overlay">
                      <div className="featured-card-content">
                        <h3 className="featured-card-title">{ev.title || ev.name}</h3>
                        <div className="featured-card-meta">
                          {d && <span>{d.weekday}, {d.month} {d.day}</span>}
                          {ev.location && <span>📍 {ev.location}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trending Discussions + Recent Activity */}
      <section className="home-section discovery-section">
        <div className="home-container discovery-grid">
          {/* Trending Discussions */}
          <div className="discovery-col">
            <div className="section-header-row">
              <h2 className="section-title">Trending Discussions</h2>
              <Link to="/forums" className="view-all-link">Forum →</Link>
            </div>
            {threadsError ? (
              <p className="section-error">{threadsError}</p>
            ) : threadsLoading ? (
              <ul className="trending-list">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className="trending-item skeleton-card">
                    <div className="skeleton skeleton-line skeleton-line-md" />
                    <div className="skeleton skeleton-line" />
                  </li>
                ))}
              </ul>
            ) : trendingThreads.length === 0 ? (
              <div className="empty-state-card empty-state-sm">
                <span className="empty-icon">💬</span>
                <p>No discussions yet.</p>
                <Link to="/forums" className="btn btn-sm btn-primary">Start a Thread</Link>
              </div>
            ) : (
              <ul className="trending-list">
                {trendingThreads.map((t, idx) => (
                  <li key={t.id || idx} className="trending-item">
                    <Link to={`/forums?open=${t.id || t._id}`} className="trending-item-link">
                      <span className="trending-rank">#{idx + 1}</span>
                      <span className="trending-body">
                        <span className="trending-title">{t.title}</span>
                        <span className="trending-meta">
                          {t.categoryName && <span className="trending-tag">{t.categoryName}</span>}
                          <span className="trending-replies">{t.replies || 0} replies</span>
                          <span className="trending-time">{timeAgo(t.lastPostAt || t.createdAt)}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="discovery-col">
            <div className="section-header-row">
              <h2 className="section-title">Recent Activity</h2>
            </div>
            {activityFeed.length === 0 && !threadsLoading && !eventsLoading && !listingsLoading && !businessesLoading ? (
              <div className="empty-state-card empty-state-sm">
                <span className="empty-icon">⚡</span>
                <p>No recent activity yet.</p>
              </div>
            ) : (
              <ul className="activity-feed">
                {activityFeed.map((item, idx) => (
                  <li key={idx} className={`activity-item activity-${item.type}`}>
                    <Link to={item.to} className="activity-item-link">
                      <span className="activity-icon">{item.icon}</span>
                      <span className="activity-body">
                        <span className="activity-title">{item.title}</span>
                        <span className="activity-meta">{item.meta}</span>
                      </span>
                      <span className="activity-time">{timeAgo(item.time)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <p className="home-footer-tagline">CarMatch — Connecting car enthusiasts since 2024</p>
          <nav className="home-footer-nav">
            <Link to="/events">Events</Link>
            <Link to="/forums">Forums</Link>
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/businesses">Shops</Link>
            <Link to="/profile">Profile</Link>
          </nav>
          <p className="home-footer-note">Built with React + Express + MongoDB on Google Cloud Run</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
