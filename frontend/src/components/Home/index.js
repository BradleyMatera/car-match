import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../Section';
import Grid from '../Grid';
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
const StatCard = ({ value, label }) => {
  const animated = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-num">{animated}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

const Home = () => {
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0, events: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [forumSections, setForumSections] = useState([]); // {id,name,threads,posts}
  const [forumsLoading, setForumsLoading] = useState(true);
  const [forumsError, setForumsError] = useState(null);
  const [latestThreads, setLatestThreads] = useState([]); // flattened + sorted by lastPostAt
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState(null);
  const [events, setEvents] = useState([]); // upcoming events
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

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

      // Forum category stats for the front cards
      setForumsLoading(true);
      try {
        const sections = await api.getForumStats();
        setForumSections(Array.isArray(sections) ? sections : []);
        setForumsError(null);
      } catch (e) {
        setForumsError('Unable to load forum categories right now.');
        setForumSections([]);
      } finally {
        setForumsLoading(false);
      }

      // Latest threads: pull small page from each category and sort by lastPostAt
      setThreadsLoading(true);
      try {
        const cats = await api.getForumCategories();
        const all = await Promise.all((cats || []).map(async (cat) => ({
          cat,
          resp: await api.getThreadsByCategory(cat.id, { page: 1, pageSize: 3 })
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
        flat.sort((a,b) => new Date(b.lastPostAt||b.createdAt) - new Date(a.lastPostAt||a.createdAt));
        setLatestThreads(flat.slice(0,6));
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
        const withDates = (evs||[]).map(e => ({...e, dateObj: new Date(e.date)})).filter(e => !isNaN(e.dateObj));
        withDates.sort((a,b) => a.dateObj - b.dateObj);
        setEvents(withDates);
        setEventsError(null);
      } catch (e) {
        setEventsError('Unable to load upcoming events right now.');
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, []);

  const featuredByType = useMemo(() => {
    const categories = [
      {
        key: 'muscle',
        title: 'Muscle Cars',
        emoji: '🏎️',
        gradient: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
        keywords: ['muscle', 'v8', 'camaro', 'mustang', 'charger']
      },
      {
        key: 'jdm',
        title: 'JDM Imports',
        emoji: '🇯🇵',
        gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        keywords: ['jdm', 'japanese', 'supra', 'rx7', 'skyline', 'silvia']
      },
      {
        key: 'classic',
        title: 'Classic Cars',
        emoji: '🚘',
        gradient: 'linear-gradient(135deg, #92400e 0%, #422006 100%)',
        keywords: ['classic', 'vintage', 'antique', 'retro', 'heritage']
      }
    ];
    const findMatch = (keywords = []) => {
      const match = events.find(e => {
        const text = `${e.title||e.name||''} ${e.description||''}`.toLowerCase();
        return keywords.some(k => text.includes(k));
      });
      return match || events.at(0);
    };
    return categories.map(c => ({ ...c, event: findMatch(c.keywords) }));
  }, [events]);

  return (
    <div className="homepage-container">
      <div
        className="page-bg home-bg"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        }}
      />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Your Perfect Car Match</h1>
          <p className="hero-text">
            Connect with fellow car enthusiasts who share your passion. 
            Discover events, make friends, and find your automotive community.
          </p>
          <Link to="/events" className="btn btn-primary hero-cta">Browse Events</Link>
        </div>
      </section>

      {/* Snapshot */}
      <Section>
        <h2 className="section-title">Community Snapshot</h2>
        {statsError ? (
          <p className="section-error">{statsError}</p>
        ) : statsLoading ? (
          <Grid cols={2} mdCols={4} gap="lg">
            <div className="stat-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-lg" /><div className="skeleton skeleton-line" /></div>
            <div className="stat-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-lg" /><div className="skeleton skeleton-line" /></div>
            <div className="stat-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-lg" /><div className="skeleton skeleton-line" /></div>
            <div className="stat-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-lg" /><div className="skeleton skeleton-line" /></div>
          </Grid>
        ) : (
          <Grid cols={2} mdCols={4} gap="lg">
            <StatCard value={stats.users} label="Members" />
            <StatCard value={stats.threads} label="Threads" />
            <StatCard value={stats.posts} label="Posts" />
            <StatCard value={stats.events} label="Events" />
          </Grid>
        )}
      </Section>

      {/* Forum front tiles */}
      <Section background="light">
        <h2 className="section-title">Forums</h2>
        {forumsError ? (
          <p className="section-error">{forumsError}</p>
        ) : forumsLoading ? (
          <div className="forum-front-cards">
            <div className="forum-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-md" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" /></div>
            <div className="forum-card skeleton-card"><div className="skeleton skeleton-line skeleton-line-md" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" /></div>
          </div>
        ) : forumSections.length === 0 ? (
          <p className="empty-state">No forum categories available yet.</p>
        ) : (
          <div className="forum-front-cards">
            {(forumSections||[]).map(s => (
              <Link key={s.id} to={`/forums`} className="forum-card">
                <div className="forum-card-title">{s.name}</div>
                <div className="forum-card-desc">{s.description}</div>
                <div className="forum-card-stats">
                  <span>{s.threads != null ? `${s.threads} threads` : ''}</span>
                  <span>{s.posts != null ? `${s.posts} posts` : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Latest discussions */}
      <Section>
        <div className="section-header-row">
          <h2 className="section-title">Latest Discussions</h2>
          <Link to="/forums" className="view-all-link">View All →</Link>
        </div>
        {threadsError ? (
          <p className="section-error">{threadsError}</p>
        ) : threadsLoading ? (
          <ul className="latest-threads">
            {[0,1,2,3,4,5].map(i => (
              <li key={i} className="lt-item skeleton-card">
                <div className="skeleton skeleton-line skeleton-line-md" />
                <div className="skeleton skeleton-line" />
              </li>
            ))}
          </ul>
        ) : latestThreads.length === 0 ? (
          <p className="empty-state">No discussions yet. Be the first to start a conversation in the forums!</p>
        ) : (
          <ul className="latest-threads">
            {latestThreads.map(t => (
              <li key={t.id} className="lt-item">
                <div className="lt-title"><Link to={`/forums?open=${t.id || t._id}`}>{t.title}</Link></div>
                <div className="lt-meta">{t.categoryName} • {new Date(t.lastPostAt || t.createdAt).toLocaleString()} • {t.replies||0} replies</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Intro Section */}
      <Section>
        <h2 className="section-title">Find Your Perfect Match & Ride</h2>
        <p className="text-center">
          Connect with fellow car enthusiasts who share your passion. 
          Meet singles who love muscle cars, JDM tuners, luxury rides, and more.
        </p>
      </Section>

      {/* Features Section */}
      <Section background="light">
        <h2 className="section-title">Why CarMatch?</h2>
        <Grid cols={1} mdCols={2} lgCols={4} gap="lg">
          <div className="card">
            <div className="card-content">
              <h3 className="card-title">🚗 Connect by Car Interests</h3>
              <p className="card-text">Find people who share your passion for specific car genres.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h3 className="card-title">🛡️ Verified Profiles</h3>
              <p className="card-text">Real enthusiasts with authentic profiles.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h3 className="card-title">📅 Events & Meetups</h3>
              <p className="card-text">Join local car enthusiast gatherings.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <h3 className="card-title">❤️ No Ads, Just Connections</h3>
              <p className="card-text">Premium experience focused on real connections.</p>
            </div>
          </div>
        </Grid>
      </Section>

      {/* Upcoming Events Section (by car type) */}
      <Section>
        <h2 className="section-title">Upcoming Events by Car Type</h2>
        {eventsError ? (
          <p className="section-error">{eventsError}</p>
        ) : eventsLoading ? (
          <Grid cols={1} mdCols={3} gap="lg">
            {[0,1,2].map(i => (
              <div key={i} className="card skeleton-card">
                <div className="cartype-banner skeleton skeleton-block" />
                <div className="card-content">
                  <div className="skeleton skeleton-line skeleton-line-md" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line" />
                </div>
              </div>
            ))}
          </Grid>
        ) : events.length === 0 ? (
          <p className="empty-state">No upcoming events yet. Check back soon or browse all events!</p>
        ) : (
          <Grid cols={1} mdCols={3} gap="lg">
            {featuredByType.map(card => {
              const ev = card.event;
              const hasEvent = !!ev;
              const title = hasEvent ? (ev.title || ev.name) : card.title;
              const dateStr = hasEvent && ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month:'long', day:'numeric', weekday:'long' }) : null;
              return (
                <Link key={card.key} to={`/events?q=${card.key}`} className="card cartype-card">
                  <div className="cartype-banner" style={{ background: card.gradient }}>
                    <span className="cartype-emoji">{card.emoji}</span>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{card.title}</h3>
                    {hasEvent ? (
                      <>
                        <p className="card-text" style={{fontWeight:600}}>{title}</p>
                        <p className="card-text">{dateStr} • {ev.location}</p>
                        <span className="btn btn-primary">View Event</span>
                      </>
                    ) : (
                      <>
                        <p className="card-text">No upcoming events yet.</p>
                        <span className="btn">Browse All Events</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </Grid>
        )}
      </Section>

      {/* Call to Action Section */}
      <Section background="primary" spacing="lg">
        <h2 className="section-title">Ready to Join the Community?</h2>
        <p className="text-center text-light">
          Connect with car enthusiasts, attend events, and share your passion.
        </p>
      </Section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <p className="home-footer-tagline">CarMatch — Connecting car enthusiasts since 2024</p>
          <nav className="home-footer-nav">
            <Link to="/events">Events</Link>
            <Link to="/forums">Forums</Link>
            <Link to="/profile">Profile</Link>
          </nav>
          <p className="home-footer-note">Built with React + Express + MongoDB on Google Cloud Run</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
