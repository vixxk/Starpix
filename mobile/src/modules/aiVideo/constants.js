export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
];

export const CATEGORIES = [
  { id: "Today's Special", iconType: 'star' },
  { id: 'Dance Video', iconType: 'music' },
  { id: "Retro 80's", iconType: 'radio' },
  { id: "Bappa in 80's", iconType: 'temple' },
  { id: 'Ganesh Chaturthi', iconType: 'temple' },
  { id: 'Devotional', iconType: 'om' },
  { id: 'Photography Video', iconType: 'camera' },
  { id: 'Motivation', iconType: 'trending' },
  { id: 'Love', iconType: 'heart' },
  { id: 'Birthday', iconType: 'cake' },
];

// Fallback high-resolution template definitions matching the reference layout
export const FALLBACK_TEMPLATES = [
  {
    _id: 'couple_ride_01',
    title: 'Vintage Indian Couple Ride',
    category: "Retro 80's",
    mediaType: 'video',
    requiredPhotos: 2,
    creditsRequired: 100,
    durationSeconds: 15,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/1f8259ce-bdf1-4094-aa69-3b35db4b3aac.jpg',
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/8a02f588-c7e8-4e48-8fe4-9d878d881783.jpg',
    ],
  },
  {
    _id: 'retro_six_frames_02',
    title: 'Retro Six Frames',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    creditsRequired: 25,
    durationSeconds: 0,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
  },
  {
    _id: 'bollywood_portrait_03',
    title: '1980s Bollywood Portrait',
    category: "Retro 80's",
    mediaType: 'image',
    requiredPhotos: 1,
    creditsRequired: 30,
    durationSeconds: 0,
    videoUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    thumbnailUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    sampleSourceImageUrl: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sampleSourceImageUrls: [
      'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    ],
  },
];
