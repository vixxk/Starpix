import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = 'starpix_downloaded_creations';
const DEFAULT_PHOTO_KEY = 'starpix_default_user_photo';
const DEFAULT_NAME_KEY = 'starpix_default_user_name';

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
    const savedUserRaw = await AsyncStorage.getItem('starpix_user_data');
    if (savedUserRaw) {
      try {
        const savedUser = JSON.parse(savedUserRaw);
        const photo = (savedUser?.profilePhoto && savedUser.profilePhoto.trim() !== '') ? savedUser.profilePhoto.trim() : null;
        const name = savedUser?.name || '';
        const currentUserId = String(savedUser?._id || savedUser?.id || '');

        let userDownloads = [];
        const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            userDownloads = parsed.filter((c) => !c.userId || String(c.userId) === currentUserId);
          }
        }

        let activePhoto = photo;
        if (photo) {
          try {
            const bgEnabled = await AsyncStorage.getItem('starpix_user_bg_removed_enabled');
            const savedCutout = await AsyncStorage.getItem('starpix_user_cutout_photo');
            if (bgEnabled === 'true' && savedCutout) {
              activePhoto = savedCutout;
            }
          } catch (_) {}
        }

        useCreationStore.setState({
          defaultUserPhotoUri: activePhoto,
          userPhotoUri: activePhoto,
          defaultUserNameText: name,
          userNameText: name,
          downloadedCreations: userDownloads,
        });
      } catch (err) {}
    } else {
      // No logged-in user: clear any legacy device-level defaults & downloads
      useCreationStore.setState({
        defaultUserPhotoUri: null,
        userPhotoUri: null,
        defaultUserNameText: '',
        userNameText: '',
        downloadedCreations: [],
      });
      AsyncStorage.removeItem(DEFAULT_PHOTO_KEY).catch(() => {});
      AsyncStorage.removeItem(DEFAULT_NAME_KEY).catch(() => {});
      AsyncStorage.removeItem(DOWNLOADS_KEY).catch(() => {});
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
  activeAiGenerations: [],
  isRestoredSession: false,

  setActiveAiGeneration: (generation) =>
    set((state) => {
      if (!generation) return { activeAiGenerations: [] };
      const filtered = (state.activeAiGenerations || []).filter(
        (g) => g.id !== generation.id && g.templateId !== generation.templateId
      );
      return { activeAiGenerations: [generation, ...filtered] };
    }),

  clearActiveAiGeneration: (templateIdOrId = null) =>
    set((state) => {
      if (!templateIdOrId) return { activeAiGenerations: [] };
      return {
        activeAiGenerations: (state.activeAiGenerations || []).filter(
          (g) => g.id !== templateIdOrId && g.templateId !== templateIdOrId
        ),
      };
    }),

  resetUserSession: () => {
    AsyncStorage.removeItem(DEFAULT_PHOTO_KEY).catch(() => {});
    AsyncStorage.removeItem(DEFAULT_NAME_KEY).catch(() => {});
    AsyncStorage.removeItem(DOWNLOADS_KEY).catch(() => {});
    set({
      defaultUserPhotoUri: null,
      userPhotoUri: null,
      defaultUserNameText: '',
      userNameText: '',
      activeTemplate: null,
      downloadedCreations: [],
      activeAiGenerations: [],
    });
  },

  setDefaultUserPhotoUri: (uri) => {
    const cleanUri = (uri && String(uri).trim() !== '') ? String(uri).trim() : null;
    set({ defaultUserPhotoUri: cleanUri, userPhotoUri: cleanUri });
    if (cleanUri) {
      AsyncStorage.setItem(DEFAULT_PHOTO_KEY, cleanUri).catch((e) => console.error(e));
    } else {
      AsyncStorage.removeItem(DEFAULT_PHOTO_KEY).catch((e) => console.error(e));
      AsyncStorage.removeItem('starpix_user_original_photo').catch(() => {});
      AsyncStorage.removeItem('starpix_user_cutout_photo').catch(() => {});
    }
  },

  setDefaultUserNameText: (name) => {
    const cleanName = name || '';
    set({ defaultUserNameText: cleanName, userNameText: cleanName });
    if (cleanName) {
      AsyncStorage.setItem(DEFAULT_NAME_KEY, cleanName).catch((e) => console.error(e));
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
      let currentUserId = null;
      try {
        const { useAuthStore } = require('./useAuthStore');
        const authUser = useAuthStore.getState().user;
        currentUserId = authUser?._id || authUser?.id || null;
      } catch (e) {}

      const creationWithUser = {
        ...creation,
        userId: creation.userId || currentUserId,
      };

      const exists = state.downloadedCreations.some(
        (item) => item.id === creationWithUser.id || item.creationId === creationWithUser.creationId
      );
      if (exists) return state;
      const updated = [creationWithUser, ...state.downloadedCreations];
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

