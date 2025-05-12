import React from 'react';
import { Link } from 'react-router-dom';
import Section from '../Section';
import Container from '../Container';
import Grid from '../Grid';
import Spacing from '../Spacing';
import './Home.css';

const Home = () => {
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
