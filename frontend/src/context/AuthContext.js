import React, { createContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await api.getMe(storedToken);
        setCurrentUser(data.user);
        setToken(storedToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      } catch (error) {
        console.error('Failed to hydrate auth user', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    const { token: authToken } = await api.loginUser(username, password);
    localStorage.setItem('authToken', authToken);
    let profile = null;
    try { const data = await api.getMe(authToken); profile = data.user; } catch {}
    if (profile) {
      localStorage.setItem('currentUser', JSON.stringify(profile));
    }
    setToken(authToken);
    setCurrentUser(profile || null);
    setLoading(false);
    return { token: authToken, user: profile };
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };
  
  // Function to update current user data if it changes (e.g., after premium upgrade)
  const updateCurrentUser = async (updatedData) => {
    if (updatedData) {
      setCurrentUser((prevUser) => {
        const newUser = { ...prevUser, ...updatedData };
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        return newUser;
      });
      return;
    }
    if (!token) return;
    try {
      const data = await api.getMe(token);
      setCurrentUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } catch (error) {
      console.error('Failed to refresh user profile', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, updateCurrentUser, loadingAuth: loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
