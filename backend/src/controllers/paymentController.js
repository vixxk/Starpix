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

  // Permanently unlock template for lifetime access for this user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { purchasedTemplates: templateId } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Payment simulated successfully (Development Mode)',
    data: {
      transactionId: purchase.transactionId,
      purchaseId: purchase._id,
      paymentStatus: 'successful',
      entitlementGranted: true,
      isUnlocked: true,
      lifetimeAccess: true,
      templateId,
      amount: purchase.amount,
      currency: purchase.currency,
      purchasedTemplates: updatedUser?.purchasedTemplates || [],
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

  // 1. Lifetime purchase check: once a template is bought, it is unlocked forever for that user
  const user = await User.findById(userId);
  const isPurchasedInUser = Boolean(
    user &&
    user.purchasedTemplates &&
    user.purchasedTemplates.some((id) => id.toString() === templateId.toString())
  );

  const purchase = isPurchasedInUser
    ? await Purchase.findOne({ userId, templateId, status: 'successful' }).sort({ createdAt: -1 })
    : await Purchase.findOne({ userId, templateId, status: 'successful' });

  if (isPurchasedInUser || purchase) {
    // If recorded in Purchase collection but not yet in user.purchasedTemplates, sync to user
    if (!isPurchasedInUser && user) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedTemplates: templateId },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: true,
        isPurchased: true,
        lifetimeAccess: true,
        transactionId: purchase?.transactionId || '',
        purchaseDate: purchase?.createdAt || null,
        reason: 'lifetime_purchase',
      },
    });
  }

  // 2. Check if user has an active global subscription (VIP Pass)
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
    // VIP-only tier — unlocks via VIP Pass or direct lifetime purchase (checked above)
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

  // VIP Pass unlocks 'premium' and 'vip' templates, but individually 'paid' templates require direct purchase
  if (isVip && template.accessType !== 'paid') {
    return res.status(200).json({
      success: true,
      data: {
        isUnlocked: true,
        reason: 'user_subscription',
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

  // Sync any template purchases into user.purchasedTemplates
  const templateIds = purchases.map((p) => p.templateId?._id || p.templateId).filter(Boolean);
  if (templateIds.length > 0) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { purchasedTemplates: { $each: templateIds } },
    });
  }

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

  // Enforce: Prevent purchasing same or lower subscription plan if user already has an active plan
  const user = await User.findById(userId);
  const now = new Date();
  const hasActiveSub = Boolean(
    user &&
    user.isPremium &&
    user.subscriptionStatus === 'active' &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > now
  );

  const getPlanTier = (pid) => {
    if (!pid) return 0;
    const s = String(pid).toLowerCase();
    if (s.includes('year') || s.includes('annual') || s.includes('365')) return 3;
    if (s.includes('30') || s.includes('month')) return 2;
    if (s.includes('7') || s.includes('week')) return 1;
    return 1;
  };

  if (hasActiveSub && user.subscriptionPlan) {
    const currentTier = getPlanTier(user.subscriptionPlan);
    const newTier = getPlanTier(plan.id);

    if (newTier <= currentTier) {
      if (newTier === currentTier) {
        return res.status(400).json({
          success: false,
          code: 'SAME_PLAN_ACTIVE',
          message: 'You already have an active subscription for this plan.',
        });
      } else {
        return res.status(400).json({
          success: false,
          code: 'LOWER_PLAN_NOT_ALLOWED',
          message: 'You cannot downgrade to a lower subscription while your current plan is active.',
        });
      }
    }
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

// @desc    Purchase AI Credits Pack
// @route   POST /api/payments/buy-credits
// @access  Private (User)
const buyCredits = asyncHandler(async (req, res) => {
  const { packId, credits, price } = req.body;
  const userId = req.user._id;

  const creditsToAdd = Number(credits);
  if (!creditsToAdd || creditsToAdd <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid credits amount' });
  }

  const transactionId = `txn_credit_${uuidv4().substring(0, 8)}`;

  const purchase = await Purchase.create({
    userId,
    templateId: null,
    purchaseType: 'ai_credits_pack',
    planId: packId || 'custom_credits',
    planName: `${creditsToAdd} AI Credits Pack`,
    productId: `credits_${packId || creditsToAdd}`,
    amount: Number(price) || 0,
    currency: 'INR',
    status: 'successful',
    paymentProvider: 'development',
    transactionId,
  });

  const user = await User.findById(userId);
  if (user) {
    const currentCredits = (user.credits !== undefined && user.credits !== null) ? Number(user.credits) : 240;
    user.credits = currentCredits + creditsToAdd;
    await user.save();

    try {
      const CreditTransaction = require('../models/CreditTransaction');
      await CreditTransaction.create({
        userId,
        type: 'credit',
        amount: creditsToAdd,
        balanceAfter: user.credits,
        reason: 'purchase',
        title: `${creditsToAdd} AI Credits`,
        description: `${creditsToAdd} AI Credits Pack Purchased (₹${Number(price) || 0})`,
        metadata: {
          packId: packId || 'custom',
          pricePaid: Number(price) || 0,
          transactionId,
        },
      });
    } catch (txErr) {
      console.error('[Payment] Error logging credit transaction:', txErr.message);
    }

    // Broadcast updated balance to SSE clients
    try {
      const { broadcastBalanceUpdate } = require('../utils/balanceSSE');
      broadcastBalanceUpdate(userId, { credits: user.credits, reason: 'purchase' });
    } catch (sseErr) {
      console.warn('[Payment] SSE broadcast error:', sseErr.message);
    }
  }

  res.status(200).json({
    success: true,
    message: `${creditsToAdd} AI Credits added successfully`,
    data: {
      transactionId: purchase.transactionId,
      purchaseId: purchase._id,
      creditsAdded: creditsToAdd,
      totalCredits: user?.credits || 0,
      user,
    },
  });
});

// @desc    Get credit transaction history (bought and spent)
// @route   GET /api/payments/credit-transactions
// @access  Private (User)
const getCreditTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const CreditTransaction = require('../models/CreditTransaction');
  const User = require('../models/User');

  const user = await User.findById(userId);
  let transactions = await CreditTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  // If user has past purchases not yet logged
  if (transactions.length === 0) {
    const pastCreditPurchases = await Purchase.find({
      userId,
      purchaseType: 'ai_credits_pack',
      status: 'successful',
    }).lean();

    for (const p of pastCreditPurchases) {
      const match = (p.planName || '').match(/(\d+)\s*AI Credits/i);
      const creditsNum = match ? parseInt(match[1], 10) : 50;
      await CreditTransaction.create({
        userId,
        type: 'credit',
        amount: creditsNum,
        balanceAfter: user?.credits || 240,
        reason: 'purchase',
        title: p.planName || `${creditsNum} AI Credits`,
        description: `Purchased for ₹${p.amount}`,
        metadata: {
          packId: p.planId,
          pricePaid: p.amount,
          transactionId: p.transactionId,
        },
        createdAt: p.createdAt,
      });
    }

    if (pastCreditPurchases.length > 0) {
      transactions = await CreditTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
    }
  }

  const totalBought = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalSpent = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      currentBalance: user?.credits !== undefined ? user.credits : 240,
      totalBought,
      totalSpent,
      transactions,
    },
  });
});

module.exports = {
  createPayment,
  verifyEntitlement,
  getMyPurchases,
  subscribeVip,
  buyCredits,
  getCreditTransactions,
};
