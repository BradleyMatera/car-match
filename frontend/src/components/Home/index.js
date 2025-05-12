import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="homepage-container">

      <main className="homepage-main">
        <section className="intro-section">
          <h2>Find Your Perfect Match & Ride</h2>
          <p>Connect with fellow car enthusiasts who share your passion. Meet singles who love muscle cars, JDM tuners, luxury rides, and more.</p>
        </section>
        <section className="features-section">
          <h2>Why CarMatch?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🚗 Connect by Car Interests</h3>
              <p>Find people who share your passion for specific car genres.</p>
            </div>
            <div className="feature-card">
              <h3>🛡️ Verified Profiles</h3>
              <p>Real enthusiasts with authentic profiles.</p>
            </div>
            <div className="feature-card">
              <h3>📅 Events & Meetups</h3>
              <p>Join local car enthusiast gatherings.</p>
            </div>
            <div className="feature-card">
              <h3>❤️ No Ads, Just Connections</h3>
              <p>Premium experience focused on real connections.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
