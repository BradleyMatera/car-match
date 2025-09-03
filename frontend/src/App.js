import React, { useContext } from 'react'; // Removed useState, useEffect from here
import { HashRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Events from './components/Events';
import Profile from './components/Profile';
import Settings from './components/Settings';
// import EntryModal from './components/EntryModal'; // Replaced by SignUp component for /signup route
import SignUp from './components/SignUp'; // Import the new SignUp component
import Login from './components/Login'; 
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
        {isLoggedIn && ( // Only show nav if logged in, or adjust as per design
          <nav>
            <ul>
              <li><Link to="/">Discover</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <li><button onClick={logout} className="logout-button">Logout</button></li>
            </ul>
          </nav>
        )}
      </header>
      <main>
        <Routes>
          {!isLoggedIn ? (
            <>
              <Route path="/login" element={<Login />} /> 
              <Route path="/signup" element={<SignUp />} /> {/* Use SignUp component */}
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/events" element={<Layout><Events /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/layout-example" element={<Layout><LayoutExample /></Layout>} />
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
