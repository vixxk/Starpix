import { Dimensions } from 'react-native';
import { resolveMediaUrl } from '../../utils/media';

export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.includes('/video/');
};

export const getFooterThumbnail = (foot) => {
  if (!foot) return null;
  if (foot.thumbnail && !isVideoUrl(foot.thumbnail)) return resolveMediaUrl(foot.thumbnail);
  if (foot.videoAsset && !isVideoUrl(foot.videoAsset)) return resolveMediaUrl(foot.videoAsset);
  return null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CANVAS_WIDTH = SCREEN_WIDTH * 0.72;
export const CANVAS_HEIGHT = CANVAS_WIDTH * (16 / 9);

export const TABS = [
  { key: 'photo', label: 'Photo', icon: 'image-outline' },
  { key: 'text', label: 'Text', icon: 'text-outline' },
  { key: 'footers', label: 'Footers', icon: 'film-outline' },
];
