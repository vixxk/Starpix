export const DEFAULT_PROMPT = 'High-quality ultra-realistic 8k AI face swap. Swap ONLY the facial identity, skin texture, expression, and features from user image onto target media face. Keep all original clothing, garments, outfit, body, hairstyle, background, lighting, and pose from target media 100% identical, unchanged, and untouched. Do not alter any clothes or attire. Zero distortion.';

export const initialForm = {
  title: '',
  titleTranslations: {},
  category: "Retro 80's",
  mediaType: 'video',
  requiredPhotos: 1,
  videoUrl: '',
  thumbnailUrl: '',
  sampleSourceImageUrl: '',
  sampleSourceImageUrls: [],
  sampleResultVideoUrl: '',
  durationSeconds: 10,
  creditsRequired: 0,
  prompt: DEFAULT_PROMPT,
  sortOrder: 0,
  isActive: true,
};
