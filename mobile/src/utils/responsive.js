import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design reference dimensions (Standard mobile baseline)
const baseWidth = 375;
const baseHeight = 812;

export const wp = (percentage) => {
  return SCREEN_WIDTH * percentage;
};

export const hp = (percentage) => {
  return SCREEN_HEIGHT * percentage;
};

export const scale = (size) => {
  return (SCREEN_WIDTH / baseWidth) * size;
};

export const verticalScale = (size) => {
  return (SCREEN_HEIGHT / baseHeight) * size;
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

export const fontScale = (size) => {
  // Scaled against a modern 390pt baseline for optimal mobile typography density
  const scaled = (SCREEN_WIDTH / 390) * size;
  return PixelRatio.roundToNearestPixel(scaled);
};

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
};

// ---- Consistent layout tokens ---------------------------------------------

// Uniform horizontal page padding (18.75px on a 375 screen)
export const SCREEN_PAD = wp(0.05);

// Standard spacing scale (4pt base)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

// Consistent grid gutters
export const GRID_GAP = 12;

// Perfectly aligned two-column card width
export const CARD_WIDTH = (wp(1) - SCREEN_PAD * 2 - GRID_GAP) / 2;

// Shared surface shadow (subtle, warm-neutral)
export const CARD_SHADOW = {
  shadowColor: '#3A2210',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.07,
  shadowRadius: 18,
  elevation: 2,
};
