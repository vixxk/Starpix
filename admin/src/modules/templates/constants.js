export const isVideoUrl = (url) => {
  if (!url) return false;
  return Boolean(
    url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ||
    url.includes('/video/') ||
    url.includes('.mp4')
  );
};

export const initialForm = (firstCategoryId) => ({
  name: '',
  nameTranslations: {},
  description: '',
  categoryId: firstCategoryId || '',
  type: 'image',
  accessType: 'free',
  price: 0,
  thumbnail: '',
  previewAsset: '',
  mainMedia: '',
  footers: [],
  order: 0,
  sortOrder: 0,
  isPinned: false,
  active: true,
  canvasConfig: {
    aspectRatio: 0.5625,
    backgroundColor: '#07140B',
    backgroundImage: '',
    layers: [
      { id: 'l1', type: 'photo', x: 0.5, y: 0.4, width: 0.65, height: 0.42, zIndex: 15 },
      { id: 'l2', type: 'text', x: 0.5, y: 0.8, width: 0.8, height: 0.1, defaultValue: 'User Name', fieldName: 'name', fontSize: 24, fontColor: '#FFFFFF', zIndex: 20 },
    ],
  },
});
