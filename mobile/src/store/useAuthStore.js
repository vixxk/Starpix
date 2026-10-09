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
      const savedToken = await AsyncStorage.getItem('starpix_user_token');
      const savedUser = await AsyncStorage.getItem('starpix_user_data');

      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        set({ token: savedToken, user: parsed });
        try {
          const { useCreationStore } = require('./useCreationStore');
          useCreationStore.getState().setDefaultUserNameText(parsed?.name || '');
          useCreationStore.getState().setDefaultUserPhotoUri(parsed?.profilePhoto || null);
        } catch (e) {}

        try {
          const { balanceSSEClient } = require('../services/balanceSSEClient');
          balanceSSEClient.ensureConnected();
        } catch (e) {}
        // Refresh profile from API
        try {
          const res = await API.get('/auth/me');
          if (res.data && res.data.success) {
            set({ user: res.data.data });
            await AsyncStorage.setItem('starpix_user_data', JSON.stringify(res.data.data));
            const { useCreationStore } = require('./useCreationStore');
            useCreationStore.getState().setDefaultUserNameText(res.data.data.name || '');
            useCreationStore.getState().setDefaultUserPhotoUri(res.data.data.profilePhoto || null);
          }
        } catch (e) {
          if (e.response && e.response.status === 401) {
            await AsyncStorage.removeItem('starpix_user_token');
            await AsyncStorage.removeItem('starpix_user_data');
            try {
              const { useCreationStore } = require('./useCreationStore');
              useCreationStore.getState().resetUserSession();
            } catch (err) {}
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

  clearError: () => set({ error: null }),

  fetchUser: async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data && res.data.success) {
        const u = res.data.data;
        const photo = (u?.profilePhoto && u.profilePhoto.trim() !== '') ? u.profilePhoto.trim() : '';
        const cleanUser = { ...u, profilePhoto: photo };
        set({ user: cleanUser });
        await AsyncStorage.setItem('starpix_user_data', JSON.stringify(cleanUser));
        try {
          const { useCreationStore } = require('./useCreationStore');
          useCreationStore.getState().setDefaultUserNameText(cleanUser.name || '');
          useCreationStore.getState().setDefaultUserPhotoUri(photo || null);
          useCreationStore.getState().setUserPhotoUri(photo || null);
        } catch (_) {}
        return cleanUser;
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  },

  requestOtp: async (phoneNumber, countryCode = '+91', isNewUser = false) => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/request-otp', { phoneNumber, countryCode, isNewUser });
      set({ isAuthenticating: false });
      return res.data;
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || 'Failed to send OTP';
      const code = err.response && err.response.data && err.response.data.code;
      // Do not populate global banner error for flows handled gracefully by interactive prompt modals
      const isHandledByModal = code === 'USER_NOT_FOUND' || code === 'USER_ALREADY_EXISTS' || err.response?.status === 404 || err.response?.status === 409;
      set({ isAuthenticating: false, error: isHandledByModal ? null : msg });
      const errorObj = new Error(msg);
      errorObj.code = code;
      errorObj.response = err.response;
      throw errorObj;
    }
  },

  verifyOtp: async (phoneNumber, countryCode = '+91', otp = '123456', name = '', isNewUser = false, email = '', profilePhoto = '') => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/verify-otp', { phoneNumber, countryCode, otp, name, email, isNewUser, profilePhoto });
      const { user, token } = res.data.data;

      await AsyncStorage.setItem('starpix_user_token', token);
      await AsyncStorage.setItem('starpix_user_data', JSON.stringify(user));

      const { useCreationStore } = require('./useCreationStore');
      useCreationStore.getState().setDefaultUserNameText(user?.name || '');
      useCreationStore.getState().setDefaultUserPhotoUri(user?.profilePhoto || null);

      set({ user, token, isAuthenticating: false });
      try {
        const { balanceSSEClient } = require('../services/balanceSSEClient');
        balanceSSEClient.ensureConnected();
      } catch (e) {}
      return user;
    } catch (err) {
      const msg = (err.response && err.response.data && err.response.data.message) || 'Invalid OTP code';
      const code = err.response && err.response.data && err.response.data.code;
      set({ isAuthenticating: false, error: msg });
      const errorObj = new Error(msg);
      errorObj.code = code;
      errorObj.response = err.response;
      throw errorObj;
    }
  },

  logout: async () => {
    try {
      const { balanceSSEClient } = require('../services/balanceSSEClient');
      balanceSSEClient.disconnect();
    } catch (e) {}
    await AsyncStorage.removeItem('starpix_user_token');
    await AsyncStorage.removeItem('starpix_user_data');
    try {
      const { useCreationStore } = require('./useCreationStore');
      useCreationStore.getState().resetUserSession();
    } catch (e) {}
    set({ user: null, token: null });
  },

  setUser: (userData) => {
    set({ user: userData });
    if (userData) {
      AsyncStorage.setItem('starpix_user_data', JSON.stringify(userData)).catch(() => {});
      try {
        const { useCreationStore } = require('./useCreationStore');
        useCreationStore.getState().setDefaultUserNameText(userData.name || '');
        useCreationStore.getState().setDefaultUserPhotoUri(userData.profilePhoto || null);
      } catch (e) {}
    } else {
      try {
        const { useCreationStore } = require('./useCreationStore');
        useCreationStore.getState().resetUserSession();
      } catch (e) {}
    }
  },

  setUserCredits: (credits) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, credits: Number(credits) };
      set({ user: updatedUser });
      AsyncStorage.setItem('starpix_user_data', JSON.stringify(updatedUser)).catch(() => {});
    }
  },

  updateUserProfile: async (updatedData) => {
    try {
      const isPhotoClearing =
        updatedData.removeProfilePhoto === true ||
        updatedData.profilePhoto === '' ||
        updatedData.profilePhoto === null;

      // Optimistic update so store and local cache immediately reflect changes
      const currentUser = get().user;
      if (currentUser) {
        const nextPhoto = isPhotoClearing
          ? ''
          : (updatedData.profilePhoto !== undefined ? updatedData.profilePhoto : (currentUser.profilePhoto || ''));
        const nextUser = {
          ...currentUser,
          name: updatedData.name !== undefined ? updatedData.name : currentUser.name,
          email: updatedData.email !== undefined ? updatedData.email : currentUser.email,
          profilePhoto: nextPhoto,
        };
        set({ user: nextUser });
        AsyncStorage.setItem('starpix_user_data', JSON.stringify(nextUser)).catch(() => {});
        try {
          const { useCreationStore } = require('./useCreationStore');
          useCreationStore.getState().setDefaultUserPhotoUri(nextPhoto || null);
          useCreationStore.getState().setUserPhotoUri(nextPhoto || null);
          if (updatedData.name !== undefined) {
            useCreationStore.getState().setDefaultUserNameText(updatedData.name);
          }
        } catch (_) {}
      }

      const res = await API.put('/auth/profile', updatedData);
      if (res.data && res.data.success) {
        const serverUser = res.data.data;
        const finalPhoto = isPhotoClearing
          ? ''
          : (serverUser?.profilePhoto !== undefined ? serverUser.profilePhoto : (updatedData.profilePhoto || ''));
        const mergedUser = { ...serverUser, profilePhoto: finalPhoto };
        set({ user: mergedUser });
        await AsyncStorage.setItem('starpix_user_data', JSON.stringify(mergedUser));
        try {
          const { useCreationStore } = require('./useCreationStore');
          useCreationStore.getState().setDefaultUserPhotoUri(finalPhoto || null);
          useCreationStore.getState().setUserPhotoUri(finalPhoto || null);
          const name = mergedUser.name !== undefined ? mergedUser.name : (updatedData.name || '');
          useCreationStore.getState().setDefaultUserNameText(name || '');
        } catch (_) {}
        return mergedUser;
      }
    } catch (e) {
      console.error('Error updating user profile:', e);
      throw e;
    }
  },

  addPurchasedTemplate: (templateId) => {
    if (!templateId) return;
    const tid = String(templateId);
    const currentUser = get().user;
    if (currentUser) {
      const existing = currentUser.purchasedTemplates || [];
      const alreadyHas = existing.some(
        (id) => (typeof id === 'object' ? String(id._id || id.id) : String(id)) === tid
      );
      if (!alreadyHas) {
        const updatedList = [...existing, tid];
        const updatedUser = { ...currentUser, purchasedTemplates: updatedList };
        set({ user: updatedUser });
        AsyncStorage.setItem('starpix_user_data', JSON.stringify(updatedUser)).catch(() => {});
      }
    }
  },

  isTemplateUnlocked: (templateId) => {
    const user = get().user;
    if (!user || !templateId) return false;
    const { checkCanAccessTemplate } = require('../utils/subscription');
    return checkCanAccessTemplate(user, { _id: templateId });
  },
}));
