import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Smart resolution for backend API URL:
// - Physical device via Expo Go: Automatically detects laptop IP from hostUri (e.g., http://192.168.0.x:5000/api)
// - Simulator / Web / Localhost: Uses http://localhost:5000/api
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  return envUrl || 'http://localhost:5000/api';
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
    }
    return Promise.reject(error);
  }
);

export default API;
