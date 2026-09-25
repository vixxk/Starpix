import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const formatApiUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.trim();
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl.replace(/\/+$/, '')}/api`;
};

const getBaseUrl = () => {
  // Read exclusively from environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return formatApiUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  // In development, support dynamic Expo Go host or dev URL
  if (isDev) {
    const hostUri =
      (Constants.expoConfig && Constants.expoConfig.hostUri) ||
      (Constants.expoGoConfig && Constants.expoGoConfig.debuggerHost) ||
      (Constants.manifest && Constants.manifest.debuggerHost) ||
      (Constants.manifest2 && Constants.manifest2.extra && Constants.manifest2.extra.expoGo && Constants.manifest2.extra.expoGo.debuggerHost);

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000/api`;
      }
    }

    if (process.env.EXPO_PUBLIC_DEV_API_URL) {
      return formatApiUrl(process.env.EXPO_PUBLIC_DEV_API_URL);
    }
  }

  // Production fallback backend URL
  return 'https://16.192.94.86.sslip.io/api';
};

const API_BASE_URL = getBaseUrl();
if (__DEV__) {
  console.log(`[Starpix Mobile API] Connecting to backend at: ${API_BASE_URL}`);
}

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('starpix_user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = await AsyncStorage.getItem('starpix_user_language');
    if (lang) {
      config.headers['Accept-Language'] = lang;
    }
  } catch (error) {
    console.error('Error reading auth token or language:', error);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('starpix_user_token');
      await AsyncStorage.removeItem('starpix_user_data');
      try {
        const { useAuthStore } = require('../store/useAuthStore');
        useAuthStore.getState().logout();
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default API;
