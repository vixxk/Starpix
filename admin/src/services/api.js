import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.PROD) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://56.228.25.105.sslip.io/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('statuzzz_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('statuzzz_admin_token');
      localStorage.removeItem('statuzzz_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
