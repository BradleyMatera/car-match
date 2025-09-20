import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../Section';
import Grid from '../Grid';
import './Home.css';
import mockApi from '../../api/mockApi';

const Home = () => {
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0, events: 0 });
  const [forumSections, setForumSections] = useState([]); // {id,name,threads,posts}
  const [latestThreads, setLatestThreads] = useState([]); // flattened + sorted by lastPostAt
  const [events, setEvents] = useState([]); // upcoming events
  // Background images (rotates like Events)
  const bgImages = useMemo(() => ([
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'
  ]), []);
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBgIndex(i => (i + 1) % bgImages.length), 8000);
    return () => clearInterval(id);
  }, [bgImages]);

  const currentBackground = useMemo(
    () => (Array.isArray(bgImages) ? bgImages.at(bgIndex) ?? '' : ''),
    [bgImages, bgIndex]
  );

  useEffect(() => {
    (async () => {
      try {
        // Site snapshot
        try { setStats(await mockApi.getSiteStats()); } catch {}
        // Forum category stats for the front cards
        let sections = [];
        try { sections = await mockApi.getForumStats(); } catch {}
        setForumSections(sections || []);
        // Latest threads: pull small page from each category and sort by lastPostAt
        try {
          const cats = await mockApi.getForumCategories();
          const all = await Promise.all((cats || []).map(async (cat) => ({
            cat,
            resp: await mockApi.getThreadsByCategory(cat.id, { page: 1, pageSize: 3 })
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
        } catch {}
        // Upcoming events
        try {
          const evs = await mockApi.getEvents();
          const withDates = (evs||[]).map(e => ({...e, dateObj: new Date(e.date)})).filter(e => !isNaN(e.dateObj));
          withDates.sort((a,b) => a.dateObj - b.dateObj);
          setEvents(withDates);
        } catch {}
      } catch {}
    })();
  }, []);

  const featuredByType = useMemo(() => {
    const categories = [
      {
        key: 'muscle',
        title: 'Muscle Cars',
        img: 'https://images.unsplash.com/photo-1584345604325-f5091269a0d1?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        keywords: ['muscle', 'v8', 'camaro', 'mustang', 'charger']
      },
      {
        key: 'jdm',
        title: 'JDM Imports',
        img: 'https://images.unsplash.com/photo-1627008118989-d5d640a259fc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8SkRNJTIwaW1wb3J0fGVufDB8fDB8fHww',
        keywords: ['jdm', 'japanese', 'supra', 'rx7', 'skyline', 'silvia']
      },
      {
        key: 'classic',
        title: 'Classic Cars',
        img: 'https://images.unsplash.com/photo-1489008777659-ad1fc8e07097?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xhc3NpYyUyMGNhcnxlbnwwfHwwfHx8MA%3D%3D',
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
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${currentBackground})`
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
          {/* Removed Events CTA to simplify hero */}
        </div>
      </section>

      {/* Snapshot */}
      <Section>
        <h2 className="section-title">Community Snapshot</h2>
        <Grid cols={2} mdCols={4} gap="lg">
          <div className="stat-card"><div className="stat-num">{stats.users}</div><div className="stat-label">Members</div></div>
          <div className="stat-card"><div className="stat-num">{stats.threads}</div><div className="stat-label">Threads</div></div>
          <div className="stat-card"><div className="stat-num">{stats.posts}</div><div className="stat-label">Posts</div></div>
          <div className="stat-card"><div className="stat-num">{stats.events}</div><div className="stat-label">Events</div></div>
        </Grid>
      </Section>

      {/* Forum front tiles */}
      <Section background="light">
        <h2 className="section-title">Forums</h2>
        <div className="forum-front-cards">
          {(forumSections||[]).map(s => (
            <Link key={s.id} to={`/forums`} className="forum-card">
              <div className="forum-card-title">{s.name}</div>
              <div className="forum-card-desc">{s.description}</div>
              <div className="forum-card-stats"><span>{s.posts} posts</span><span>{s.threads} threads</span></div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Latest discussions */}
      <Section>
        <h2 className="section-title">Latest Discussions</h2>
        <ul className="latest-threads">
          {latestThreads.map(t => (
            <li key={t.id} className="lt-item">
              <div className="lt-title"><Link to={`/forums?open=${t.id || t._id}`}>{t.title}</Link></div>
              <div className="lt-meta">{t.categoryName} • {new Date(t.lastPostAt || t.createdAt).toLocaleString()} • {t.replies||0} replies</div>
            </li>
          ))}
          {latestThreads.length === 0 && (<li className="lt-item">No discussions yet.</li>)}
        </ul>
      </Section>

      {/* Intro Section */}
      <Section>
        <h2 className="section-title">Find Your Perfect Match & Ride</h2>
        <p className="text-center">
          Connect with fellow car enthusiasts who share your passion. 
          Meet singles who love muscle cars, JDM tuners, luxury rides, and more.
        </p>
        {/* Removed extra spacing and Events CTA for a cleaner flow */}
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
        <Grid cols={1} mdCols={3} gap="lg">
          {featuredByType.map(card => {
            const ev = card.event;
            const hasEvent = !!ev;
            const img = (ev && (ev.image || ev.thumbnail)) || card.img;
            const title = hasEvent ? (ev.title || ev.name) : card.title;
            const dateStr = hasEvent && ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month:'long', day:'numeric', weekday:'long' }) : null;
            return (
              <div key={card.key} className="card">
                <img src={img} alt={card.title} className="card-img" loading="lazy" />
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  {hasEvent ? (
                    <>
                      <p className="card-text" style={{fontWeight:600}}>{title}</p>
                      <p className="card-text">{dateStr} • {ev.location}</p>
                      <Link to={`/events?event=${encodeURIComponent(ev.id)}`} className="btn btn-primary">View Event</Link>
                    </>
                  ) : (
                    <>
                      <p className="card-text">No upcoming events yet.</p>
                      <Link to="/events" className="btn">Browse All Events</Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Grid>
      </Section>

      {/* Call to Action Section */}
      <Section background="primary" spacing="lg">
        <h2 className="section-title">Ready to Join the Community?</h2>
        <p className="text-center text-light">
          Connect with car enthusiasts, attend events, and share your passion.
        </p>
        {/* Removed Events CTA to declutter the footer callout */}
      </Section>
    </div>
  );
};

export default Home;
