const asyncHandler = require('../utils/asyncHandler');
const Purchase = require('../models/Purchase');
const Template = require('../models/Template');
const User = require('../models/User');
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
  const isVip = Boolean(user && user.isPremium && user.subscriptionStatus === 'active');

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
        price: 199,
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

module.exports = {
  createPayment,
  verifyEntitlement,
  getMyPurchases,
};
