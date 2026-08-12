import { create } from 'zustand';

export const useCreationStore = create((set, get) => ({
  activeTemplate: null,
  userPhotoUri: null,
  userNameText: 'Vivek Sharma',
  userQuoteText: '',
  selectedFrame: null,
  selectedEffect: null,

  // Photo transform controls
  photoScale: 1,
  photoRotation: 0,
  photoOffsetX: 0,
  photoOffsetY: 0,

  // Entitlement & Download state
  isUnlocked: false,
  unlockedDownloadUrl: null,

  setActiveTemplate: (template) => {
    const nameLayer = template?.canvasConfig?.layers?.find((l) => l.fieldName === 'name');
    set({
      activeTemplate: template,
      userNameText: nameLayer?.defaultValue || 'Your Name',
      userQuoteText: '',
      userPhotoUri: null,
      selectedFrame: null,
      selectedEffect: null,
      photoScale: 1,
      photoRotation: 0,
      photoOffsetX: 0,
      photoOffsetY: 0,
      isUnlocked: template?.accessType === 'free',
      unlockedDownloadUrl: null,
    });
  },

  setUserPhotoUri: (uri) => set({ userPhotoUri: uri }),
  setUserNameText: (text) => set({ userNameText: text }),
  setUserQuoteText: (text) => set({ userQuoteText: text }),
  setSelectedFrame: (frame) => set({ selectedFrame: frame }),
  setSelectedEffect: (effect) => set({ selectedEffect: effect }),

  setPhotoTransform: (transform) => set((state) => ({ ...state, ...transform })),
  setEntitlementStatus: (isUnlocked, downloadUrl = null) => set({ isUnlocked, unlockedDownloadUrl: downloadUrl }),

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
      isUnlocked: false,
      unlockedDownloadUrl: null,
    }),
}));
