import axios from 'axios';

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('starpix_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('starpix_admin_token');
      localStorage.removeItem('starpix_admin_user');
      localStorage.removeItem('starpix_admin_expiry');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
