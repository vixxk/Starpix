import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../utils/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticating: false,
  error: null,

  initializeAuth: async () => {
    try {
      const savedToken = await AsyncStorage.getItem('statuzzz_user_token');
      const savedUser = await AsyncStorage.getItem('statuzzz_user_data');

      if (savedToken && savedUser) {
        set({ token: savedToken, user: JSON.parse(savedUser) });
        // Refresh profile from API
        try {
          const res = await API.get('/auth/me');
          if (res.data && res.data.success) {
            set({ user: res.data.data });
            await AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(res.data.data));
          }
        } catch (e) {
          if (e.response && e.response.status === 401) {
            await AsyncStorage.removeItem('statuzzz_user_token');
            await AsyncStorage.removeItem('statuzzz_user_data');
            set({ user: null, token: null });
          }
        }
      } else {
        set({ user: null, token: null });
      }
    } catch (err) {
      console.error('Error restoring auth state:', err);
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },

  requestOtp: async (phoneNumber, countryCode = '+91') => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/request-otp', { phoneNumber, countryCode });
      set({ isAuthenticating: false });
      return res.data;
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || 'Failed to send OTP';
      set({ isAuthenticating: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyOtp: async (phoneNumber, countryCode = '+91', otp = '123456', name = '') => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/verify-otp', { phoneNumber, countryCode, otp, name });
      const { user, token } = res.data.data;

      await AsyncStorage.setItem('statuzzz_user_token', token);
      await AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(user));

      set({ user, token, isAuthenticating: false });
      return user;
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || 'Invalid OTP code';
      set({ isAuthenticating: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('statuzzz_user_token');
    await AsyncStorage.removeItem('statuzzz_user_data');
    set({ user: null, token: null });
  },

  updateUserProfile: async (updatedData) => {
    try {
      const res = await API.put('/auth/profile', updatedData);
      if (res.data.success) {
        set({ user: res.data.data });
        await AsyncStorage.setItem('statuzzz_user_data', JSON.stringify(res.data.data));
      }
    } catch (e) {
      console.error('Error updating user profile:', e);
    }
  },
}));
