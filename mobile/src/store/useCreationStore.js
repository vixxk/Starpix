import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = 'statuzzz_downloaded_creations';
const DEFAULT_PHOTO_KEY = 'statuzzz_default_user_photo';
const DEFAULT_NAME_KEY = 'statuzzz_default_user_name';

// Fire-and-forget persistence for the downloaded creations list.
const persistDownloads = (creations) => {
  AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(creations)).catch((e) =>
    console.error('Failed to persist downloads:', e)
  );
};

/**
 * Load saved downloads and default user photo/name from AsyncStorage into the store.
 * Call once at app startup (see app/_layout.jsx).
 */
export const hydrateDownloadedCreations = async () => {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        useCreationStore.setState({ downloadedCreations: parsed });
      }
    }
    const defaultPhoto = await AsyncStorage.getItem(DEFAULT_PHOTO_KEY);
    if (defaultPhoto) {
      useCreationStore.setState({ defaultUserPhotoUri: defaultPhoto });
    }
    const defaultName = await AsyncStorage.getItem(DEFAULT_NAME_KEY);
    if (defaultName) {
      useCreationStore.setState({ defaultUserNameText: defaultName, userNameText: defaultName });
    }
  } catch (e) {
    console.error('Failed to hydrate store state:', e);
  }
};

export const useCreationStore = create((set, get) => ({
  activeTemplate: null,
  userNameText: '',
  userQuoteText: '',
  userPhotoUri: null,
  defaultUserPhotoUri: null,
  defaultUserNameText: '',
  selectedEffect: null,

  // Photo placement controls
  photoScale: 1,
  photoRotation: 0,
  photoOffsetX: 0,
  photoOffsetY: 0,

  // Name placement controls
  nameOffsetX: 0,
  nameOffsetY: 0,
  nameFontSizeScale: 1,

  isUnlocked: false,
  unlockedDownloadUrl: null,
  downloadedCreations: [],
  isRestoredSession: false,

  setDefaultUserPhotoUri: (uri) => {
    set({ defaultUserPhotoUri: uri, userPhotoUri: uri || get().userPhotoUri });
    if (uri) {
      AsyncStorage.setItem(DEFAULT_PHOTO_KEY, uri).catch((e) => console.error(e));
    } else {
      AsyncStorage.removeItem(DEFAULT_PHOTO_KEY).catch((e) => console.error(e));
    }
  },

  setDefaultUserNameText: (name) => {
    set({ defaultUserNameText: name, userNameText: name || get().userNameText });
    if (name) {
      AsyncStorage.setItem(DEFAULT_NAME_KEY, name).catch((e) => console.error(e));
    } else {
      AsyncStorage.removeItem(DEFAULT_NAME_KEY).catch((e) => console.error(e));
    }
  },

  setActiveTemplate: (template, profileName = null, initialPhoto = null) => {
    const { useAuthStore } = require('./useAuthStore');
    const authUser = useAuthStore.getState().user;
    const nameLayer = template && template.canvasConfig && template.canvasConfig.layers && template.canvasConfig.layers.find((l) => l.fieldName === 'name');
    const defaultName = profileName || authUser?.name || authUser?.displayName || get().defaultUserNameText || (nameLayer && nameLayer.defaultValue) || '';
    const defaultPhoto = initialPhoto || get().defaultUserPhotoUri || authUser?.profilePhoto || null;
    set({
      activeTemplate: template,
      userNameText: defaultName,
      userQuoteText: '',
      userPhotoUri: defaultPhoto,
      selectedEffect: get().selectedEffect || get().selectedFooter || null,
      selectedFooter: get().selectedFooter || get().selectedEffect || null,
      photoScale: 1,
      photoRotation: 0,
      photoOffsetX: 0,
      photoOffsetY: 0,
      nameOffsetX: 0,
      nameOffsetY: 0,
      nameFontSizeScale: 1,
      layerTransforms: {},
      isUnlocked: template ? template.accessType === 'free' : false,
      unlockedDownloadUrl: null,
      isRestoredSession: false,
    });
  },

  setUserPhotoUri: (uri) => set({ userPhotoUri: uri }),
  setUserNameText: (text) => set({ userNameText: text }),
  setUserQuoteText: (text) => set({ userQuoteText: text }),
  setSelectedEffect: (effect) => set({ selectedEffect: effect, selectedFooter: effect }),
  setSelectedFooter: (footer) => set({ selectedFooter: footer, selectedEffect: footer }),

  // Layer-specific independent transforms
  layerTransforms: {},

  setPhotoTransform: (transform) =>
    set((state) => ({
      photoScale: transform.photoScale !== undefined ? transform.photoScale : state.photoScale,
      photoRotation: transform.photoRotation !== undefined ? transform.photoRotation : state.photoRotation,
      photoOffsetX: transform.photoOffsetX !== undefined ? transform.photoOffsetX : state.photoOffsetX,
      photoOffsetY: transform.photoOffsetY !== undefined ? transform.photoOffsetY : state.photoOffsetY,
    })),

  setNameTransform: (transform) =>
    set((state) => ({
      nameOffsetX: transform.nameOffsetX !== undefined ? transform.nameOffsetX : state.nameOffsetX,
      nameOffsetY: transform.nameOffsetY !== undefined ? transform.nameOffsetY : state.nameOffsetY,
      nameFontSizeScale: transform.nameFontSizeScale !== undefined ? transform.nameFontSizeScale : state.nameFontSizeScale,
    })),

  setLayerTransform: (layerId, transform) =>
    set((state) => ({
      layerTransforms: {
        ...state.layerTransforms,
        [layerId]: {
          ...(state.layerTransforms[layerId] || {}),
          ...transform,
        },
      },
    })),

  removePhoto: () => set({ userPhotoUri: null, photoScale: 1, photoRotation: 0, photoOffsetX: 0, photoOffsetY: 0 }),
  removeName: () => set({ userNameText: '', nameOffsetX: 0, nameOffsetY: 0, nameFontSizeScale: 1 }),

  addDownloadedCreation: (creation) =>
    set((state) => {
      const exists = state.downloadedCreations.some((item) => item.id === creation.id || item.creationId === creation.creationId);
      if (exists) return state;
      const updated = [creation, ...state.downloadedCreations];
      persistDownloads(updated);
      return { downloadedCreations: updated };
    }),

  removeDownloadedCreation: (id) =>
    set((state) => {
      const updated = state.downloadedCreations.filter((item) => item.id !== id && item.creationId !== id);
      persistDownloads(updated);
      return { downloadedCreations: updated };
    }),

  clearDownloadedCreations: () => {
    set({ downloadedCreations: [] });
    persistDownloads([]);
  },

  setEntitlementStatus: (isUnlocked, downloadUrl = null) => set({ isUnlocked, unlockedDownloadUrl: downloadUrl }),

  restoreCreationState: (savedState) => {
    if (!savedState || !savedState.activeTemplate) return;
    set({
      activeTemplate: savedState.activeTemplate,
      userPhotoUri: savedState.userPhotoUri || savedState.editedPhoto || null,
      userNameText: savedState.userNameText || savedState.editedText || '',
      userQuoteText: savedState.userQuoteText || '',
      selectedEffect: savedState.selectedEffect || null,
      photoScale: savedState.photoScale || 1,
      photoRotation: savedState.photoRotation || 0,
      photoOffsetX: savedState.photoOffsetX || 0,
      photoOffsetY: savedState.photoOffsetY || 0,
      nameOffsetX: savedState.nameOffsetX || 0,
      nameOffsetY: savedState.nameOffsetY || 0,
      nameFontSizeScale: savedState.nameFontSizeScale || 1,
      isUnlocked: true,
      isRestoredSession: true,
    });
  },

  resetCreation: () => {
    const defaultPhoto = get().defaultUserPhotoUri || null;
    set({
      activeTemplate: null,
      userPhotoUri: defaultPhoto,
      userNameText: get().defaultUserNameText || '',
      selectedEffect: null,
      photoScale: 1,
      photoRotation: 0,
      photoOffsetX: 0,
      photoOffsetY: 0,
      nameOffsetX: 0,
      nameOffsetY: 0,
      nameFontSizeScale: 1,
      isUnlocked: false,
      unlockedDownloadUrl: null,
    });
  },
}));

