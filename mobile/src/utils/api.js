import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

  if (!isDev) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://56.228.25.105.sslip.io/api';
  }

  // Local development mode: detect Expo Go host IP dynamically if available
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

  return process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();
console.log(`[Statuzzz Mobile API] Connecting to backend at: ${API_BASE_URL}`);

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

API.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('statuzzz_user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error reading auth token:', error);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('statuzzz_user_token');
      await AsyncStorage.removeItem('statuzzz_user_data');
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
