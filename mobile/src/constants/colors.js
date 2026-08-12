import { fontScale } from '../utils/responsive';

export const COLORS = {
  // Surfaces — clean white + warm white
  background: '#FFF9F3',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1E4',
  overlay: 'rgba(43, 24, 10, 0.55)',
  border: '#F7E3D0',
  borderStrong: '#F0CDAF',

  // Brand orange
  orange: '#F97316',
  orangeDeep: '#EA580C',
  orangeLight: '#FB923C',
  orangeSoft: '#FDBA74',
  orangeTint: 'rgba(249, 115, 22, 0.10)',

  // Text
  ink: '#221608',
  inkMuted: '#8A7A68',
  inkFaint: '#C4B3A2',
  white: '#FFFFFF',
  onOrange: '#FFFFFF',

  // Utility
  water: '#25D366',
  success: '#16A34A',
  gold: '#F59E0B',
  error: '#EF4444',
};

export const GRADIENTS = {
  primary: ['#F97316', '#FB923C', '#FDBA74'],
  deep: ['#EA580C', '#F97316'],
  soft: ['rgba(253, 186, 116, 0.16)', 'rgba(255, 249, 243, 0)'],
};

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
};

// Global type scale — every screen reuses these so typography stays consistent.
export const TYPO = {
  display: { fontSize: fontScale(30), fontFamily: FONTS.extrabold, letterSpacing: -0.8 },
  h1: { fontSize: fontScale(24), fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  h2: { fontSize: fontScale(18), fontFamily: FONTS.extrabold, letterSpacing: -0.3 },
  h3: { fontSize: fontScale(15), fontFamily: FONTS.bold, letterSpacing: -0.2 },
  body: { fontSize: fontScale(13.5), fontFamily: FONTS.medium, lineHeight: fontScale(20) },
  small: { fontSize: fontScale(12), fontFamily: FONTS.medium },
  caption: {
    fontSize: fontScale(10.5),
    fontFamily: FONTS.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  micro: {
    fontSize: fontScale(9.5),
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
