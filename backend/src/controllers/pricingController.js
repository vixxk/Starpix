const asyncHandler = require('../utils/asyncHandler');
const PricingSetting = require('../models/PricingSetting');

const DEFAULT_PLANS = [
  {
    id: '7days',
    name: '7 Days Access',
    price: 29,
    durationDays: 7,
    periodKey: 'sub_plan_7_days',
    ctaKey: 'sub_cta_7_days',
    badgeText: '',
    badgeType: '',
    badgeKey: '',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_no_ads',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '30days',
    name: '30 Days Access',
    price: 99,
    durationDays: 30,
    periodKey: 'sub_plan_30_days',
    ctaKey: 'sub_cta_30_days',
    badgeText: 'MOST POPULAR',
    badgeType: 'popular',
    badgeKey: 'sub_most_popular',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_30',
      'sub_feat_no_ads',
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '1year',
    name: '1 Year Access',
    price: 599,
    durationDays: 365,
    periodKey: 'sub_plan_1_year',
    ctaKey: 'sub_cta_1_year',
    badgeText: 'BEST VALUE',
    badgeType: 'best_value',
    badgeKey: 'sub_best_value',
    features: [
      'sub_feat_all_premium',
      'sub_feat_daily_new',
      'sub_feat_full_access_year',
      'sub_feat_no_ads',
      'sub_feat_exclusive_festivals',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

const DEFAULT_POSTERS = [
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/ccead801-2abb-4d74-8f50-7bee9c53fa7a.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/eb57459c-c20d-4bbb-8fee-5f5464efb57d.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/d81f4913-f71e-433f-b803-c3f27777967c.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/6adc6e37-9b98-4470-9a27-e2915e73b4e3.jpg',
];

const DEFAULT_CHECKLIST = [
  { id: 'templates', text: 'Thousands of Premium Templates', textKey: 'sub_feat_thousands', iconType: 'p_box' },
  { id: 'morning_night', text: 'Good Morning & Good Night Special', textKey: 'sub_feat_morning_night', iconType: 'sun' },
  { id: 'festival_devotional', text: 'Festival & Devotional Special', textKey: 'sub_feat_festival_devotional', iconType: 'flower' },
  { id: 'trending_viral', text: 'Trending & Viral Designs', textKey: 'sub_feat_trending_viral', iconType: 'trending' },
  { id: 'personalization', text: 'Name & Photo Personalization', textKey: 'sub_feat_name_photo', iconType: 'person' },
  { id: 'download_share', text: 'HD Download & Fast Share', textKey: 'sub_feat_download_share', iconType: 'download' },
  { id: 'new_content', text: 'Daily New Content Added', textKey: 'sub_feat_new_content', iconType: 'sparkles' },
];

// Helper to get or initialize settings document
const getOrInitPricing = async () => {
  let setting = await PricingSetting.findOne();
  if (!setting) {
    setting = await PricingSetting.create({
      currency: 'INR',
      plans: DEFAULT_PLANS,
      freeTemplateLimit: 0,
      previewProtectionEnabled: true,
      posters: DEFAULT_POSTERS,
      checklist: DEFAULT_CHECKLIST,
    });
  } else {
    let modified = false;
    if (!setting.plans || setting.plans.length === 0) {
      setting.plans = DEFAULT_PLANS;
      setting.currency = 'INR';
      modified = true;
    }
    if (!setting.posters || setting.posters.length === 0) {
      setting.posters = DEFAULT_POSTERS;
      modified = true;
    }
    if (!setting.checklist || setting.checklist.length === 0) {
      setting.checklist = DEFAULT_CHECKLIST;
      modified = true;
    }
    if (modified) {
      await setting.save();
    }
  }
  return setting;
};

// @desc    Get pricing settings for admin
// @route   GET /api/admin/pricing
// @access  Private (Admin)
const getAdminPricing = asyncHandler(async (req, res) => {
  const setting = await getOrInitPricing();
  res.status(200).json({
    success: true,
    data: setting,
  });
});

// @desc    Update pricing settings & 3 subscription packs
// @route   PUT /api/admin/pricing
// @access  Private (Admin)
const updateAdminPricing = asyncHandler(async (req, res) => {
  const { plans, freeTemplateLimit, previewProtectionEnabled, posters, checklist } = req.body;

  let setting = await PricingSetting.findOne();
  if (!setting) {
    setting = new PricingSetting({ currency: 'INR' });
  }

  // Enforce INR currency exclusively (no USD)
  setting.currency = 'INR';

  if (Array.isArray(plans)) {
    setting.plans = plans.map((p, idx) => ({
      id: p.id || `pack_${idx + 1}`,
      name: p.name || `Plan ${idx + 1}`,
      price: Math.max(0, Number(p.price) || 0),
      durationDays: Math.max(1, Number(p.durationDays) || 30),
      periodKey: p.periodKey || '',
      ctaKey: p.ctaKey || '',
      badgeText: p.badgeText || '',
      badgeType: p.badgeType || '',
      badgeKey: p.badgeKey || '',
      features: Array.isArray(p.features) ? p.features.filter((f) => typeof f === 'string' && f.trim() !== '') : [],
      isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
      sortOrder: Number(p.sortOrder) || idx + 1,
    }));
  }

  if (Array.isArray(posters)) {
    setting.posters = posters.filter((p) => typeof p === 'string' && p.trim() !== '');
  }

  if (Array.isArray(checklist)) {
    setting.checklist = checklist.map((c, idx) => ({
      id: c.id || `feat_${idx + 1}`,
      text: c.text || '',
      textKey: c.textKey || '',
      iconType: c.iconType || 'checkmark',
    }));
  }

  if (freeTemplateLimit !== undefined) {
    setting.freeTemplateLimit = Math.max(0, parseInt(freeTemplateLimit, 10) || 0);
  }

  if (previewProtectionEnabled !== undefined) {
    setting.previewProtectionEnabled = Boolean(previewProtectionEnabled);
  }

  await setting.save();

  res.status(200).json({
    success: true,
    message: 'Pricing settings updated successfully',
    data: setting,
  });
});

// @desc    Get public active subscription plans for mobile app
// @route   GET /api/payments/plans
// @access  Public / User
const getPublicPlans = asyncHandler(async (req, res) => {
  const setting = await getOrInitPricing();
  const activePlans = (setting.plans || [])
    .filter((p) => p.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  res.status(200).json({
    success: true,
    currency: 'INR',
    currencySymbol: '₹',
    data: activePlans.length > 0 ? activePlans : DEFAULT_PLANS,
    posters: Array.isArray(setting.posters) && setting.posters.length > 0 ? setting.posters : DEFAULT_POSTERS,
    checklist: Array.isArray(setting.checklist) && setting.checklist.length > 0 ? setting.checklist : DEFAULT_CHECKLIST,
    previewProtectionEnabled: setting.previewProtectionEnabled,
  });
});

module.exports = {
  getAdminPricing,
  updateAdminPricing,
  getPublicPlans,
  DEFAULT_PLANS,
  DEFAULT_POSTERS,
  DEFAULT_CHECKLIST,
};
