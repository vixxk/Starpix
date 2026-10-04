export const S3_BASE = 'https://starpix-media-production.s3.ap-south-1.amazonaws.com';

export const DEFAULT_REELS = [
  {
    id: 'durga_puja_1',
    title: 'Happy Durga Puja',
    category: 'durga_puja',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/durga_puja_reel.mp4`,
    posterUrl: `${S3_BASE}/frames/durga_puja_thumb.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'retro_80s_1',
    title: "Retro 80's Bollywood",
    category: 'retro_80s',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/retro_80s_reel.mp4`,
    posterUrl: `${S3_BASE}/reels/retro_80s.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'vintage_couple_1',
    title: 'Vintage Couple Ride',
    category: 'dance_video',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/vintage_couple_reel.mp4`,
    posterUrl: `${S3_BASE}/reels/vintage_couple.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'good_morning_1',
    title: 'Good Morning Sunrise',
    category: 'good_morning',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/good_morning_reel.mp4`,
    posterUrl: `${S3_BASE}/frames/sunrise_thumb.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'mahadev_bhakti_1',
    title: 'Mahadev Divine Bhakti',
    category: 'bhakti',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/mahadev_bhakti_reel.mp4`,
    posterUrl: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'diwali_festive_1',
    title: 'Diwali Festive Lights',
    category: 'festivals',
    mediaType: 'image',
    mediaUrl: `${S3_BASE}/frames/diya_mandala_thumb.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'tomorrow_1',
    title: 'Tomorrow Divine Auspicious Day',
    category: 'tomorrow',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/good_morning_reel.mp4`,
    posterUrl: `${S3_BASE}/frames/sunrise_thumb.jpg`,
    defaultFrame: 'none',
  },
  {
    id: 'trending_1',
    title: 'Trending Viral Beats',
    category: 'trending',
    mediaType: 'video',
    mediaUrl: `${S3_BASE}/reels/retro_80s_reel.mp4`,
    posterUrl: `${S3_BASE}/reels/retro_80s.jpg`,
    defaultFrame: 'none',
  },
];

export const FRAME_OPTIONS = [
  { id: 'none', isNone: true, thumb: null },
];

export const CATEGORY_CHIPS = [
  // Row 1 (2 items)
  [
    { id: 'special', icon: '⭐', labelKey: 'todays_special', isSpecial: true },
    { id: 'trending', icon: '🔥', labelKey: 'trending' },
  ],
  // Row 2 (2 items)
  [
    { id: 'durga_puja', icon: '🪷', labelKey: 'durga_puja' },
    { id: 'good_morning', icon: '☀️', labelKey: 'good_morning' },
  ],
  // Row 3 (3 items)
  [
    { id: 'bhakti', icon: '🕉', labelKey: 'bhakti' },
    { id: 'dance_video', icon: '🎵', labelKey: 'dance_video' },
    { id: 'all', icon: '⊞', labelKey: 'all' },
  ],
  // Row 4 (3 items)
  [
    { id: 'retro_80s', icon: '📻', labelKey: 'retro_80s' },
    { id: 'tomorrow', icon: '📅', labelKey: 'tomorrow' },
    { id: 'festivals', icon: '🎉', labelKey: 'festivals' },
  ],
  // Row 5 (2 items)
  [
    { id: 'devotional', icon: '🙏', labelKey: 'devotional', name: 'Devotional' },
    { id: 'love', icon: '❤️', labelKey: 'love', name: 'Love & Romance' },
  ],
  // Row 6 (1 item)
  [
    { id: 'birthday', icon: '🎂', labelKey: 'birthday', name: 'Birthday Wishes' },
  ],
];
