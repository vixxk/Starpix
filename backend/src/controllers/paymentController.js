const asyncHandler = require('../utils/asyncHandler');
const Purchase = require('../models/Purchase');
const Template = require('../models/Template');
const User = require('../models/User');
const PricingSetting = require('../models/PricingSetting');
const { v4: uuidv4 } = require('uuid');

// @desc    Initiate/Create payment transaction
// @route   POST /api/payments/create
// @access  Private (User)
const createPayment = asyncHandler(async (req, res) => {
  const { templateId, productId = 'starpix_single_unlock', amount = 49 } = req.body;
  const userId = req.user._id;

  if (!templateId) {
    return res.status(400).json({ success: false, message: 'Template ID is required' });
  }

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Free templates never need a purchase
  if (template.accessType === 'free') {
    return res.status(400).json({ success: false, message: 'This template is free — no unlock needed' });
  }

  // VIP-only templates can't be unlocked individually — they require the VIP pass
  if (template.accessType === 'vip') {
    return res.status(400).json({ success: false, message: 'VIP-only template — subscribe to the VIP Pass to unlock' });
  }

  const transactionId = `txn_dev_${uuidv4().substring(0, 8)}`;

  // TODO: Replace development payment success logic with real payment verification before production.
  // Create development purchase record immediately as successful
  const purchase = await Purchase.create({
    userId,
    templateId,
    productId,
    amount: template.price || amount,
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    status: 'successful',
    paymentProvider: 'development',
    transactionId,
    finalAssetUrl: template.mainMedia,
  });

  // Increment template purchase count & update user
  template.purchasesCount += 1;
  template.uses += 1;
  template.trendingScore = template.views * 0.2 + template.uses * 0.4 + template.favoritesCount * 0.2 + template.purchasesCount * 0.2;
  await template.save();

  res.status(200).json({
    success: true,
    message: 'Payment simulated successfully (Development Mode)',
    data: {
      transactionId: purchase.transactionId,
      purchaseId: purchase._id,
      paymentStatus: 'successful',
      entitlementGranted: true,
      amount: purchase.amount,
      currency: purchase.currency,
    },
  });
});

// @desc    Verify payment entitlement status for user & template
// @route   GET /api/payments/verify/:templateId
// @access  Private (User)
const verifyEntitlement = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Free templates are always accessible
  if (template.accessType === 'free') {
    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: true,
        reason: 'free_template',
      },
    });
  }

  // Check if user has an active global subscription (VIP Pass)
  const user = await User.findById(userId);
  let isVip = Boolean(user && user.isPremium && user.subscriptionStatus === 'active');
  if (isVip && user.subscriptionExpiresAt && new Date() > new Date(user.subscriptionExpiresAt)) {
    user.isPremium = false;
    user.subscriptionStatus = 'expired';
    await user.save();
    isVip = false;
  }

  // Get active pricing plans
  const pricing = await PricingSetting.findOne();
  const lowestVipPrice = (pricing?.plans && pricing.plans.length > 0)
    ? Math.min(...pricing.plans.filter((p) => p.isActive !== false).map((p) => p.price))
    : 29;

  if (template.accessType === 'vip') {
    // VIP-only tier — unlocks exclusively via the VIP Pass
    if (isVip) {
      return res.status(200).json({
        success: true,
        data: {
          isUnlocked: true,
          reason: 'vip_subscription',
        },
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: false,
        price: lowestVipPrice,
        reason: 'vip_required',
      },
    });
  }

  // premium / paid — unlocked by the VIP Pass or an individual purchase
  if (isVip) {
    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: true,
        reason: 'user_subscription',
      },
    });
  }

  // Check specific template purchase
  const purchase = await Purchase.findOne({
    userId,
    templateId,
    status: 'successful',
  });

  if (purchase) {
    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: true,
        transactionId: purchase.transactionId,
        purchaseDate: purchase.createdAt,
        reason: 'individual_purchase',
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      isUnlocked: false,
      price: template.price || 49,
      reason: 'payment_required',
    },
  });
});

// @desc    Get user's past purchases
// @route   GET /api/payments/my-purchases
// @access  Private (User)
const getMyPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({
    userId: req.user._id,
    status: 'successful',
  })
    .populate('templateId')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: purchases,
  });
});

// @desc    Purchase VIP Subscription Plan
// @route   POST /api/payments/subscribe
// @access  Private (User)
const subscribeVip = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  if (!planId) {
    return res.status(400).json({ success: false, message: 'Plan ID is required' });
  }

  const pricing = await PricingSetting.findOne();
  let plan = pricing?.plans?.find((p) => p.id === planId && p.isActive !== false);

  if (!plan) {
    const fallbackPlans = {
      '7days': { id: '7days', name: '7 Days Access', price: 29, durationDays: 7 },
      '30days': { id: '30days', name: '30 Days Access', price: 99, durationDays: 30 },
      '1year': { id: '1year', name: '1 Year Access', price: 599, durationDays: 365 },
    };
    plan = fallbackPlans[planId];
  }

  if (!plan) {
    return res.status(400).json({ success: false, message: 'Invalid or inactive VIP plan selected' });
  }

  const durationDays = Number(plan.durationDays) || 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  const transactionId = `txn_vip_${uuidv4().substring(0, 8)}`;

  const purchase = await Purchase.create({
    userId,
    templateId: null,
    purchaseType: 'vip_subscription',
    planId: plan.id,
    planName: plan.name,
    productId: `vip_pack_${plan.id}`,
    amount: plan.price,
    currency: pricing?.currency || 'INR',
    status: 'successful',
    paymentProvider: 'development',
    transactionId,
  });

  const user = await User.findById(userId);
  if (user) {
    user.isPremium = true;
    user.subscriptionStatus = 'active';
    user.subscriptionPlan = plan.id;
    user.subscriptionExpiresAt = expiryDate;
    user.subscriptionDurationDays = durationDays;
    user.vipGrantedBy = 'purchase';
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: `Subscribed to ${plan.name} successfully`,
    data: {
      transactionId: purchase.transactionId,
      purchaseId: purchase._id,
      amount: purchase.amount,
      currency: purchase.currency,
      planId: plan.id,
      planName: plan.name,
      expiresAt: expiryDate,
      user: {
        isPremium: user?.isPremium,
        subscriptionStatus: user?.subscriptionStatus,
        subscriptionPlan: user?.subscriptionPlan,
        subscriptionExpiresAt: user?.subscriptionExpiresAt,
      },
    },
  });
});

module.exports = {
  createPayment,
  verifyEntitlement,
  getMyPurchases,
  subscribeVip,
};
