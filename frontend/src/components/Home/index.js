import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../Section';
import Grid from '../Grid';
import Spacing from '../Spacing';
import './Home.css';
import mockApi from '../../api/mockApi';

const Home = () => {
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0, events: 0 });
  const [forumSections, setForumSections] = useState([]); // {id,name,threads,posts}
  const [latestThreads, setLatestThreads] = useState([]); // flattened + sorted by lastPostAt

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
          const all = await Promise.all((cats||[]).map(c => mockApi.getThreadsByCategory(c.id, { page:1, pageSize:3 })));
          const flat = [];
          all.forEach((resp,i) => {
            const items = Array.isArray(resp)?resp:(resp.items||[]);
            items.forEach(t => flat.push({ ...t, categoryId:(cats[i]||{}).id, categoryName:(cats[i]||{}).name }));
          });
          flat.sort((a,b) => new Date(b.lastPostAt||b.createdAt) - new Date(a.lastPostAt||a.createdAt));
          setLatestThreads(flat.slice(0,6));
        } catch {}
      } catch {}
    })();
  }, []);
  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Your Perfect Car Match</h1>
          <p className="hero-text">
            Connect with fellow car enthusiasts who share your passion. 
            Discover events, make friends, and find your automotive community.
          </p>
          <Link to="/events" className="cta-button">Explore Events</Link>
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
            <Link key={s.id} to={`/forums`} className="forum-card" onClick={(e)=>{ /* let user click, they can select category in sidebar */ }}>
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
        <Spacing mt="xl" />
        <div className="text-center">
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
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

      {/* Featured Cars Section */}
      <Section>
        <h2 className="section-title">Featured Car Categories</h2>
        <Grid cols={1} mdCols={3} gap="lg">
          <div className="card">
            <img 
              src="https://images.unsplash.com/photo-1584345604325-f5091269a0d1?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Muscle Car" 
              className="card-img" 
              loading="lazy"
            />
            <div className="card-content">
              <h3 className="card-title">Muscle Cars</h3>
              <p className="card-text">Discover the power and style of American muscle cars.</p>
              <Link to="/events" className="btn btn-primary">Explore</Link>
            </div>
          </div>
          
          <div className="card">
            <img 
              src="https://images.unsplash.com/photo-1627008118989-d5d640a259fc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8SkRNJTIwaW1wb3J0fGVufDB8fDB8fHww" 
              alt="JDM Car" 
              className="card-img" 
              loading="lazy"
            />
            <div className="card-content">
              <h3 className="card-title">JDM Imports</h3>
              <p className="card-text">Experience the precision and innovation of Japanese imports.</p>
              <Link to="/events" className="btn btn-primary">Explore</Link>
            </div>
          </div>
          
          <div className="card">
            <img 
              src="https://images.unsplash.com/photo-1489008777659-ad1fc8e07097?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xhc3NpYyUyMGNhcnxlbnwwfHwwfHx8MA%3D%3D" 
              alt="Classic Car" 
              className="card-img" 
              loading="lazy"
            />
            <div className="card-content">
              <h3 className="card-title">Classic Cars</h3>
              <p className="card-text">Appreciate the timeless elegance of classic automobiles.</p>
              <Link to="/events" className="btn btn-primary">Explore</Link>
            </div>
          </div>
        </Grid>
      </Section>

      {/* Call to Action Section */}
      <Section background="primary" spacing="lg">
        <h2 className="section-title">Ready to Join the Community?</h2>
        <p className="text-center text-light">
          Connect with car enthusiasts, attend events, and share your passion.
        </p>
        <Spacing mt="lg" />
        <div className="text-center">
          <Link to="/events" className="btn btn-secondary">Browse Events</Link>
        </div>
      </Section>
    </div>
  );
};

export default Home;
