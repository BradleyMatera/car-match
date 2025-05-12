import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Events from './components/Events';
import Profile from './components/Profile';
import Settings from './components/Settings';
import EntryModal from './components/EntryModal';
import Layout from './components/Layout';
import LayoutExample from './components/LayoutExample';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('userProfile');
    if (userData) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleModalSubmit = (formData) => {
    localStorage.setItem('userProfile', JSON.stringify(formData));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className={`App ${!isLoggedIn ? 'modal-active' : ''}`}>
        <header className="top-nav">
          <div className="logo">CarMatch</div>
          <nav className={!isLoggedIn ? 'disabled' : ''}>
            <ul>
              <li><Link to="/">Discover</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              {/* Layout example link commented out for production */}
              {/* <li><Link to="/layout-example">Layout Examples</Link></li> */}
              {isLoggedIn && <li><button onClick={handleLogout} className="logout-button">Logout</button></li>}
            </ul>
          </nav>
        </header>
        <main>
          {!isLoggedIn && <EntryModal onSubmit={handleModalSubmit} />}
          {isLoggedIn && (
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/layout-example" element={<LayoutExample />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
