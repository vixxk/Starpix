const asyncHandler = require('../utils/asyncHandler');
const AICreditSetting = require('../models/AICreditSetting');

const DEFAULT_AI_CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    nameKey: 'pack_starter',
    descKey: 'pack_starter_desc',
    description: 'Perfect for quick festival wishes & single portrait generation',
    credits: 25,
    creditsDisplay: '25 AI Credits',
    price: '₹ 25',
    priceNum: 25,
    iconType: 'gift',
    badgeKey: 'first_purchase_only',
    badgeType: 'starter',
    isPopular: false,
    isBestValue: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'value',
    name: 'Value Pack',
    nameKey: 'pack_value',
    descKey: 'pack_value_desc',
    description: 'Great for 2 portraits or 1 standard video face swap',
    credits: 50,
    creditsDisplay: '50 AI Credits',
    price: '₹ 49',
    priceNum: 49,
    iconType: 'coins_small',
    badgeKey: '',
    badgeType: '',
    isPopular: false,
    isBestValue: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    nameKey: 'pack_creator',
    descKey: 'pack_creator_desc',
    description: 'Best choice for creators posting daily statuses',
    credits: 240,
    creditsDisplay: '240 AI Credits',
    price: '₹ 199',
    priceNum: 199,
    iconType: 'coins_med',
    badgeKey: 'most_popular',
    badgeType: 'popular',
    isPopular: true,
    isBestValue: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    nameKey: 'pack_pro',
    descKey: 'pack_pro_desc',
    description: 'Generous balance for multi-face couple videos & HD styles',
    credits: 600,
    creditsDisplay: '600 AI Credits',
    price: '₹ 449',
    priceNum: 449,
    iconType: 'coins_large',
    badgeKey: '',
    badgeType: '',
    isPopular: false,
    isBestValue: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'power',
    name: 'Power Pack',
    nameKey: 'pack_power',
    descKey: 'pack_power_desc',
    description: 'Heavy duty generation for video creators & studios',
    credits: 1200,
    creditsDisplay: '1,200 AI Credits',
    price: '₹ 799',
    priceNum: 799,
    iconType: 'coins_stack',
    badgeKey: '',
    badgeType: '',
    isPopular: false,
    isBestValue: false,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    nameKey: 'pack_ultimate',
    descKey: 'pack_ultimate_desc',
    description: 'Maximum savings with massive credit reserve',
    credits: 2500,
    creditsDisplay: '2,500 AI Credits',
    price: '₹ 1,499',
    priceNum: 1499,
    iconType: 'coins_gold',
    badgeKey: 'best_value',
    badgeType: 'best_value',
    isPopular: false,
    isBestValue: true,
    isActive: true,
    sortOrder: 6,
  },
];

const DEFAULT_USAGE_GUIDE = [
  {
    id: 'basic_image',
    type: 'image',
    title: 'Basic Face Swap Photo',
    titleKey: 'usage_basic_image',
    range: '20–25 Credits',
    image: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
    sortOrder: 1,
  },
  {
    id: 'premium_image',
    type: 'image',
    title: 'Premium Style Portrait',
    titleKey: 'usage_premium_image',
    range: '40–60 Credits',
    image: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
    sortOrder: 2,
  },
  {
    id: 'collage',
    type: 'image',
    title: 'Multi-Frame Photo Grid',
    titleKey: 'usage_collage',
    range: '70–100 Credits',
    image: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/4c03b402-0f4b-46a6-8241-c3ddc6288dbf.jpg',
    sortOrder: 3,
  },
  {
    id: 'video_std',
    type: 'video',
    title: 'Standard Video (15s)',
    titleKey: 'usage_video_std',
    range: '350–400 Credits',
    image: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/c4902ddb-bfbf-4801-91b8-b0e0ba17af7c.jpg',
    sortOrder: 4,
  },
  {
    id: 'video_prem',
    type: 'video',
    title: 'Cinematic 4K Video (30s)',
    titleKey: 'usage_video_prem',
    range: '450–550 Credits',
    image: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
    sortOrder: 5,
  },
];

const DEFAULT_HERO_BANNER = {
  headline: 'Create Amazing',
  subheadline: 'AI Photos & Videos',
  description: 'Use AI credits to transform photos into 8K realistic Bollywood portraits, festival videos, and trending reels',
  magicScript: 'Turn photos into magic',
  heroGirlImage: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/d0b84582-8bc9-428b-bef6-1ba72f1cc506.jpg',
  heroGirlBeforeImage: 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
};

// Helper: Get or initialize AI Credit Setting document
const getOrInitAICreditSetting = async () => {
  let setting = await AICreditSetting.findOne();
  if (!setting) {
    setting = await AICreditSetting.create({
      currency: 'INR',
      packs: DEFAULT_AI_CREDIT_PACKS,
      usageGuide: DEFAULT_USAGE_GUIDE,
      heroBanner: DEFAULT_HERO_BANNER,
    });
  } else {
    let changed = false;
    if (!setting.packs || setting.packs.length === 0) {
      setting.packs = DEFAULT_AI_CREDIT_PACKS;
      changed = true;
    }
    if (!setting.usageGuide || setting.usageGuide.length === 0) {
      setting.usageGuide = DEFAULT_USAGE_GUIDE;
      changed = true;
    }
    if (!setting.heroBanner || !setting.heroBanner.headline) {
      setting.heroBanner = DEFAULT_HERO_BANNER;
      changed = true;
    }
    if (changed) {
      await setting.save();
    }
  }
  return setting;
};

// @desc    Get AI Credit Settings (Public)
// @route   GET /api/ai-credits
// @access  Public
const getAICredits = asyncHandler(async (req, res) => {
  const setting = await getOrInitAICreditSetting();
  // Filter active packs for mobile user
  const activePacks = (setting.packs || []).filter((p) => p.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  const activeGuide = (setting.usageGuide || []).sort((a, b) => a.sortOrder - b.sortOrder);

  res.status(200).json({
    success: true,
    data: {
      currency: setting.currency || 'INR',
      heroBanner: setting.heroBanner || DEFAULT_HERO_BANNER,
      packs: activePacks,
      usageGuide: activeGuide,
    },
  });
});

// @desc    Get AI Credit Settings (Admin)
// @route   GET /api/admin/ai-credits
// @access  Private (Admin)
const getAdminAICredits = asyncHandler(async (req, res) => {
  const setting = await getOrInitAICreditSetting();
  res.status(200).json({
    success: true,
    data: setting,
  });
});

// @desc    Update AI Credit Settings (Admin)
// @route   PUT /api/admin/ai-credits
// @access  Private (Admin)
const updateAdminAICredits = asyncHandler(async (req, res) => {
  const { packs, heroBanner, usageGuide, currency } = req.body;

  let setting = await AICreditSetting.findOne();
  if (!setting) {
    setting = new AICreditSetting();
  }

  if (Array.isArray(packs)) {
    setting.packs = packs;
  }
  if (heroBanner && typeof heroBanner === 'object') {
    setting.heroBanner = {
      ...DEFAULT_HERO_BANNER,
      ...heroBanner,
    };
  }
  if (Array.isArray(usageGuide)) {
    setting.usageGuide = usageGuide;
  }
  if (currency) {
    setting.currency = currency;
  }

  await setting.save();

  res.status(200).json({
    success: true,
    message: 'AI Credits settings updated successfully',
    data: setting,
  });
});

module.exports = {
  getAICredits,
  getAdminAICredits,
  updateAdminAICredits,
  getOrInitAICreditSetting,
  DEFAULT_AI_CREDIT_PACKS,
  DEFAULT_USAGE_GUIDE,
  DEFAULT_HERO_BANNER,
};
