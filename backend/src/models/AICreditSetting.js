const mongoose = require('mongoose');

const creditPackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    nameKey: { type: String, default: '' },
    descKey: { type: String, default: '' },
    description: { type: String, default: '' },
    credits: { type: Number, required: true },
    creditsDisplay: { type: String, default: '' },
    price: { type: String, required: true },
    priceNum: { type: Number, default: 0 },
    iconType: {
      type: String,
      enum: ['gift', 'coins_small', 'coins_med', 'coins_large', 'coins_stack', 'coins_gold'],
      default: 'coins_med',
    },
    badgeKey: { type: String, default: '' },
    badgeType: {
      type: String,
      enum: ['', 'starter', 'popular', 'best_value', 'custom'],
      default: '',
    },
    isPopular: { type: Boolean, default: false },
    isBestValue: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const usageGuideSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    title: { type: String, required: true },
    titleKey: { type: String, default: '' },
    range: { type: String, required: true },
    image: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const heroBannerSchema = new mongoose.Schema(
  {
    headline: { type: String, default: 'Create Amazing' },
    subheadline: { type: String, default: 'AI Photos & Videos' },
    description: {
      type: String,
      default: 'Use AI credits to transform photos into 8K realistic Bollywood portraits, festival videos, and trending reels',
    },
    magicScript: { type: String, default: 'Turn photos into magic' },
    heroGirlImage: {
      type: String,
      default: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    },
    heroGirlBeforeImage: {
      type: String,
      default: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    },
  },
  { _id: false }
);

const aiCreditSettingSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'INR' },
    heroBanner: { type: heroBannerSchema, default: () => ({}) },
    packs: { type: [creditPackSchema], default: [] },
    usageGuide: { type: [usageGuideSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AICreditSetting', aiCreditSettingSchema);
