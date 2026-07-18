import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Events from './components/Events';
import Profile from './components/Profile';
import Forums from './components/Forums';
import SignUp from './components/SignUp';
import Login from './components/Login';
import VehicleLookup from './components/VehicleLookup';
import BusinessDirectory from './components/BusinessDirectory';
import Marketplace from './components/Marketplace';
import Layout from './components/Layout';
import AuthContext, { AuthProvider } from './context/AuthContext';
import { trackPageView } from './utils/analytics';

function AppContent() {
  const { currentUser, logout, loadingAuth } = useContext(AuthContext);
  const isLoggedIn = !!currentUser;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    trackPageView(`${location.pathname}${location.search}${hash}`);
  }, [location]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (loadingAuth) {
    return <div className="app-loading">Loading application...</div>;
  }

  const navLinks = isLoggedIn ? (
    <>
      <li><Link to="/">Discover</Link></li>
      <li><Link to="/events">Events</Link></li>
      <li><Link to="/forums">Forums</Link></li>
      <li><Link to="/marketplace">Marketplace</Link></li>
      <li><Link to="/businesses">Shops</Link></li>
      <li><Link to="/vehicle-lookup">Garage Tools</Link></li>
      <li><Link to="/profile">Profile</Link></li>
      <li><button onClick={logout} className="logout-button">Logout</button></li>
    </>
  ) : null;

  return (
    <div className={`App ${!isLoggedIn ? 'modal-active' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <header className="top-nav">
        <div className="logo">CarMatch</div>
        {isLoggedIn && (
          <>
            <nav className="nav-desktop">
              <ul>
                {navLinks}
              </ul>
            </nav>
            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </>
        )}
      </header>
      {isLoggedIn && mobileMenuOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)} />
          <nav className="nav-mobile">
            <ul>
              {navLinks}
            </ul>
          </nav>
        </>
      )}
      <main>
        <Routes>
          {!isLoggedIn ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/events" element={<Layout><Events /></Layout>} />
              <Route path="/forums" element={<Layout><Forums /></Layout>} />
              <Route path="/vehicle-lookup" element={<Layout><VehicleLookup /></Layout>} />
              <Route path="/businesses" element={<Layout><BusinessDirectory /></Layout>} />
              <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
