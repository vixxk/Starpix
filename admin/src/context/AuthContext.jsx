import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('statuzzz_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('statuzzz_admin_token');
      if (token) {
        try {
          const res = await API.get('/admin/auth/me');
          setAdmin(res.data.data);
          localStorage.setItem('statuzzz_admin_user', JSON.stringify(res.data.data));
        } catch (err) {
          setAdmin(null);
          localStorage.removeItem('statuzzz_admin_token');
          localStorage.removeItem('statuzzz_admin_user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/admin/auth/login', { email, password });
    const { token, admin } = res.data.data;
    localStorage.setItem('statuzzz_admin_token', token);
    localStorage.setItem('statuzzz_admin_user', JSON.stringify(admin));
    setAdmin(admin);
    return admin;
  };

  const logout = async () => {
    try {
      await API.post('/admin/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('statuzzz_admin_token');
    localStorage.removeItem('statuzzz_admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
