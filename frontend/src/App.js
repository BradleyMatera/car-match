import React, { useContext } from 'react'; // Removed useState, useEffect from here
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
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

  // The old handleModalSubmit might need to call context's login or a registration function
  const handleModalSubmit = (formData) => {
    // This was for the old EntryModal. If EntryModal is a registration form:
    // authContext.register(formData) then authContext.login(formData.username, formData.password)
    // For now, we'll assume Login component handles login.
    console.log("EntryModal submitted, needs integration with AuthContext", formData);
  };

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
    <li>
      <div className="dropdown">
        <button className="dropdown-button">Account</button>
        <div className="dropdown-content">
          <Link to="/signup">Sign Up</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </li>
    {isLoggedIn && <li><button onClick={logout} className="logout-button">Logout</button></li>}
  </ul>
</nav>
      </header>
      <main>
        <Routes>
          {/* Public routes accessible to all */}
          {/* If logged in and trying to access login/signup, redirect to home */}
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<SignUp />} />

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
