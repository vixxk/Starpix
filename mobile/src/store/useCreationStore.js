import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = 'statuzzz_downloaded_creations';

// Fire-and-forget persistence for the downloaded creations list.
const persistDownloads = (creations) => {
  AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(creations)).catch((e) =>
    console.error('Failed to persist downloads:', e)
  );
};

/**
 * Load saved downloads from AsyncStorage into the store.
 * Call once at app startup (see app/_layout.jsx).
 */
export const hydrateDownloadedCreations = async () => {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      useCreationStore.setState({ downloadedCreations: parsed });
    }
  } catch (e) {
    console.error('Failed to hydrate downloads:', e);
  }
};

export const useCreationStore = create((set, get) => ({
  activeTemplate: null,
  userNameText: '',
  userQuoteText: '',
  selectedFrame: null,
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

  setActiveTemplate: (template, profileName = null) => {
    const nameLayer = template && template.canvasConfig && template.canvasConfig.layers && template.canvasConfig.layers.find((l) => l.fieldName === 'name');
    const defaultName = profileName || (nameLayer && nameLayer.defaultValue) || 'Your Name';
    set({
      activeTemplate: template,
      userNameText: defaultName,
      userQuoteText: '',
      userPhotoUri: null,
      selectedFrame: null,
      selectedEffect: null,
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
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  setSelectedEffect: (effect) => set({ selectedEffect: effect }),

  // Layer-specific independent transforms
  layerTransforms: {},

  setPhotoTransform: (transform) => set((state) => ({ ...state, ...transform })),
  setNameTransform: (transform) => set((state) => ({ ...state, ...transform })),
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

  removePhoto: () =>
    set({
      userPhotoUri: null,
      photoScale: 1,
      photoRotation: 0,
      photoOffsetX: 0,
      photoOffsetY: 0,
    }),

  removeName: () =>
    set({
      userNameText: '',
      nameOffsetX: 0,
      nameOffsetY: 0,
      nameFontSizeScale: 1,
    }),

  addDownloadedCreation: (creationItem) => {
    const { downloadedCreations } = get();
    const exists = downloadedCreations.some((item) => item.id === creationItem.id);
    if (exists) return;
    const next = [creationItem, ...downloadedCreations];
    set({ downloadedCreations: next });
    persistDownloads(next);
  },

  removeDownloadedCreation: (id) => {
    const next = get().downloadedCreations.filter((item) => item.id !== id);
    set({ downloadedCreations: next });
    persistDownloads(next);
  },

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
      selectedFrame: savedState.selectedFrame || null,
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

  resetCreation: () =>
    set({
      activeTemplate: null,
      userPhotoUri: null,
      userNameText: 'Your Name',
      selectedFrame: null,
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
    }),
}));

