import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('statuzzz_admin_user');
    const expiry = localStorage.getItem('statuzzz_admin_expiry');
    if (expiry && Date.now() > Number(expiry)) {
      localStorage.removeItem('statuzzz_admin_token');
      localStorage.removeItem('statuzzz_admin_user');
      localStorage.removeItem('statuzzz_admin_expiry');
      return null;
    }
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('statuzzz_admin_token');
      const expiry = localStorage.getItem('statuzzz_admin_expiry');

      if (token) {
        if (expiry && Date.now() > Number(expiry)) {
          // Session expired after 7 days
          localStorage.removeItem('statuzzz_admin_token');
          localStorage.removeItem('statuzzz_admin_user');
          localStorage.removeItem('statuzzz_admin_expiry');
          setAdmin(null);
          setLoading(false);
          return;
        }

        try {
          const res = await API.get('/admin/auth/me');
          setAdmin(res.data.data);
          localStorage.setItem('statuzzz_admin_user', JSON.stringify(res.data.data));
          // If no expiry set yet, default to 7 days from now
          if (!expiry) {
            localStorage.setItem('statuzzz_admin_expiry', (Date.now() + SEVEN_DAYS_MS).toString());
          }
        } catch (err) {
          setAdmin(null);
          localStorage.removeItem('statuzzz_admin_token');
          localStorage.removeItem('statuzzz_admin_user');
          localStorage.removeItem('statuzzz_admin_expiry');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/admin/auth/login', { email, password });
    const { token, admin, expiresAt } = res.data.data;
    const expiryTime = expiresAt ? new Date(expiresAt).getTime() : Date.now() + SEVEN_DAYS_MS;

    localStorage.setItem('statuzzz_admin_token', token);
    localStorage.setItem('statuzzz_admin_user', JSON.stringify(admin));
    localStorage.setItem('statuzzz_admin_expiry', expiryTime.toString());
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
    localStorage.removeItem('statuzzz_admin_expiry');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
