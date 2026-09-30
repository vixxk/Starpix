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

// Helper to get or initialize settings document
const getOrInitPricing = async () => {
  let setting = await PricingSetting.findOne();
  if (!setting) {
    setting = await PricingSetting.create({
      currency: 'INR',
      plans: DEFAULT_PLANS,
      freeTemplateLimit: 0,
      previewProtectionEnabled: true,
    });
  } else if (!setting.plans || setting.plans.length === 0) {
    setting.plans = DEFAULT_PLANS;
    setting.currency = 'INR';
    await setting.save();
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
  const { plans, freeTemplateLimit, previewProtectionEnabled } = req.body;

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
    previewProtectionEnabled: setting.previewProtectionEnabled,
  });
});

module.exports = {
  getAdminPricing,
  updateAdminPricing,
  getPublicPlans,
  DEFAULT_PLANS,
};
