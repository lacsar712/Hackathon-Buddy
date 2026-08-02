import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, load user from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('hb_token');
    const saved = localStorage.getItem('hb_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('hb_token', token);
    localStorage.setItem('hb_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hb_token');
    localStorage.removeItem('hb_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = (updatedUser) => {
    localStorage.setItem('hb_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
