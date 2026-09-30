export const S3_BASE = 'https://starpix-media-production.s3.ap-south-1.amazonaws.com';

export const DEFAULT_REELS = [
  {
    id: 'durga_puja_1',
    title: 'Happy Durga Puja',
    category: 'durga_puja',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/durga_puja_reel_bg.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'retro_80s_1',
    title: "Retro 80's Bollywood",
    category: 'retro_80s',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/retro_80s.jpg`,
    defaultFrame: 'mandala',
  },
  {
    id: 'vintage_couple_1',
    title: 'Vintage Couple Ride',
    category: 'dance_video',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/reels/vintage_couple.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'good_morning_1',
    title: 'Good Morning Sunrise',
    category: 'good_morning',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/frames/sunrise_thumb.jpg`,
    defaultFrame: 'durga_puja',
  },
  {
    id: 'diwali_festive_1',
    title: 'Diwali Festive Lights',
    category: 'festivals',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
    defaultFrame: 'durga_puja',
  },
];

export const FRAME_OPTIONS = [
  { id: 'none', isNone: true, thumb: null },
  { id: 'durga_puja', isNone: false, thumb: `${S3_BASE}/frames/durga_puja_thumb.jpg` },
  { id: 'moon_lake', isNone: false, thumb: `${S3_BASE}/frames/frame_moon_lake.jpg` },
  { id: 'moon_clouds', isNone: false, thumb: `${S3_BASE}/frames/moon_clouds_thumb.jpg` },
  { id: 'mandala', isNone: false, thumb: `${S3_BASE}/frames/diya_mandala_thumb.jpg` },
  { id: 'diya_temple', isNone: false, thumb: `${S3_BASE}/frames/sunrise_thumb.jpg` },
  { id: 'couple', isNone: false, thumb: `${S3_BASE}/frames/couple_thumb.jpg` },
];

export const CATEGORY_CHIPS = [
  // Row 1
  [
    { id: 'special', icon: '⭐', labelKey: 'todays_special', isSpecial: true },
    { id: 'trending', icon: '🔥', labelKey: 'trending' },
    { id: 'durga_puja', icon: '🪷', labelKey: 'durga_puja' },
  ],
  // Row 2
  [
    { id: 'good_morning', icon: '☀️', labelKey: 'good_morning' },
    { id: 'bhakti', icon: '🕉', labelKey: 'bhakti' },
    { id: 'dance_video', icon: '🎵', labelKey: 'dance_video' },
    { id: 'all', icon: '⊞', labelKey: 'all' },
  ],
  // Row 3
  [
    { id: 'retro_80s', icon: '📻', labelKey: 'retro_80s' },
    { id: 'tomorrow', icon: '📅', labelKey: 'tomorrow' },
    { id: 'festivals', icon: '🎉', labelKey: 'festivals' },
    { id: 'more', icon: null, chevron: true, labelKey: 'more' },
  ],
];
