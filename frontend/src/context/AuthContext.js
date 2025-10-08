import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to parse stored user', error);
    localStorage.removeItem('currentUser');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((sessionToken, user) => {
    if (sessionToken) {
      localStorage.setItem('authToken', sessionToken);
      setToken(sessionToken);
    }
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          const storedUser = readStoredUser();
          if (storedUser) setCurrentUser(storedUser);
          try {
            const refreshed = await api.getCurrentUser();
            if (!cancelled) persistSession(storedToken, refreshed);
          } catch (err) {
            console.warn('Unable to refresh user session', err);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, [persistSession]);

  const login = async (username, password) => {
    const session = await api.loginUser(username, password);
    persistSession(session.token, session.user);
    try {
      const refreshed = await api.getCurrentUser();
      persistSession(session.token, refreshed);
      return refreshed;
    } catch (error) {
      console.warn('Failed to hydrate user after login', error);
      return session.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };

  const updateCurrentUser = async (updatedData) => {
    const nextUser = { ...(currentUser || {}), ...updatedData };
    localStorage.setItem('currentUser', JSON.stringify(nextUser));
    setCurrentUser(nextUser);
    return nextUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        login,
        logout,
        updateCurrentUser,
        loadingAuth: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
