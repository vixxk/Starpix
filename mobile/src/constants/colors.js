import { fontScale } from '../utils/responsive';

export const COLORS = {
  // Surfaces — clean white + soft rose
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1F2',
  overlay: 'rgba(28, 10, 15, 0.65)',
  border: '#FFE4E6',
  borderStrong: '#FECDD3',

  // Reddish (Maroon) Theme (matching login & user home page)
  maroon: '#9F1239',
  maroonDeep: '#881337',
  crimson: '#E11D48',
  primary: '#E11D48',
  primaryDeep: '#9F1239',
  primaryLight: '#F43F5E',
  primarySoft: '#FDA4AF',
  primaryTint: 'rgba(225, 29, 72, 0.08)',

  // Legacy mappings aliased to Reddish Maroon for backward compatibility across all screens
  orange: '#E11D48',
  orangeDeep: '#9F1239',
  orangeLight: '#F43F5E',
  orangeSoft: '#FDA4AF',
  orangeTint: 'rgba(225, 29, 72, 0.08)',

  // Text
  ink: '#111827',
  inkMuted: '#6B7280',
  inkFaint: '#9CA3AF',
  white: '#FFFFFF',
  onOrange: '#FFFFFF',

  // Utility
  water: '#25D366',
  success: '#16A34A',
  gold: '#F59E0B',
  error: '#EF4444',
};

// Neo-Brutalist palette — aligned with the red/maroon brand
export const BRUTAL = {
  bone: '#FAFAFA', // page background
  paper: '#FFFFFF', // card surface
  paperAlt: '#FFF1F2',
  ink: '#17120C', // near-black (borders / slabs / hard shadows)
  inkSoft: '#40382E',
  inkMute: '#6F6354',
  inkFaint: '#A29683',
  flame: '#EE1D24', // brand red/maroon
  flameDark: '#9F1239',
  flameLight: '#E11D48',
  white: '#FFFFFF',
  error: '#DC2626',
};

// Brutalist display face (Anton — same as the admin panel)
export const BRUTAL_FONT = 'Anton_400Regular';

export const GRADIENTS = {
  primary: ['#9F1239', '#BE123C', '#E11D48'],
  deep: ['#881337', '#9F1239'],
  soft: ['rgba(253, 164, 175, 0.18)', 'rgba(255, 241, 242, 0)'],
};

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
  display: BRUTAL_FONT, // Anton — condensed caps, brutalist headlines
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
