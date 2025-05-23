import React, { createContext, useState, useEffect } from 'react';
import mockApi from '../api/mockApi'; // For any auth-related API calls if needed

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Error parsing stored user data", e);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const userData = await mockApi.loginUser(username, password); // Fetches from backend
    localStorage.setItem('authToken', userData.token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setToken(userData.token);
    setCurrentUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };
  
  // Function to update current user data if it changes (e.g., after premium upgrade)
  const updateCurrentUser = (updatedData) => {
    setCurrentUser(prevUser => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, updateCurrentUser, loadingAuth: loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
