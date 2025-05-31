import React, { useContext } from 'react'; // Removed useState, useEffect from here
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Events from './components/Events';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Layout from './components/Layout';
import LayoutExample from './components/LayoutExample';
import AuthContext, { AuthProvider } from './context/AuthContext';

function AppContent() { 
  const { currentUser, logout, loadingAuth } = useContext(AuthContext);
  const isLoggedIn = !!currentUser; // Determine login status from currentUser

  if (loadingAuth) {
    return <div>Loading application...</div>; // Or a proper spinner
  }

  return (
    <div className={`App ${!isLoggedIn ? 'modal-active' : ''}`}>
      <header className="top-nav">
        <div className="logo">CarMatch</div>
        <nav>
          <ul>
            <li><Link to="/">Discover</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/settings">Settings</Link></li>
            {isLoggedIn && <li><button onClick={logout} className="logout-button">Logout</button></li>}
          </ul>
        </nav>
      </header>
      <main>
        <Routes>
          {/* Protected routes - if not logged in, redirect to /login */}
          <Route path="/" element={isLoggedIn ? <Layout><Home /></Layout> : <Navigate to="/login" />} />
          <Route path="/events" element={isLoggedIn ? <Layout><Events /></Layout> : <Navigate to="/login" />} />
          <Route path="/profile" element={isLoggedIn ? <Layout><Profile /></Layout> : <Navigate to="/login" />} />
          <Route path="/settings" element={isLoggedIn ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
          <Route path="/layout-example" element={isLoggedIn ? <Layout><LayoutExample /></Layout> : <Navigate to="/login" />} />
          
          {/* Catch-all route: if logged in, go to home, otherwise go to login page */}
          <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router basename="/car-match">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
