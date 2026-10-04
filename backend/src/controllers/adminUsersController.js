const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Analytics = require('../models/Analytics');
const DeletionLog = require('../models/DeletionLog');
const PricingSetting = require('../models/PricingSetting');

// @desc    Get all registered users with metrics and deletion status
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { search, isPremium, status } = req.query;

  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (isPremium === 'true') query.isPremium = true;
  if (isPremium === 'false') query.isPremium = false;

  if (status === 'deleted') {
    query.isDeleted = true;
  } else if (status === 'active') {
    query.isDeleted = { $ne: true };
  }

  const [total, activeCount, deletedCount] = await Promise.all([
    User.countDocuments(query),
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ isDeleted: true }),
  ]);

  const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

  // Compute aggregated purchase metrics for each user
  const usersWithMetrics = await Promise.all(
    users.map(async (u) => {
      const userPurchases = await Purchase.find({ userId: u._id, status: 'successful' });
      const totalSpent = userPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const userObj = u.toObject();
      userObj.totalPurchases = userPurchases.length;
      userObj.totalSpent = totalSpent;
      return userObj;
    })
  );

  res.status(200).json({
    success: true,
    data: usersWithMetrics,
    summary: {
      totalAll: activeCount + deletedCount,
      active: activeCount,
      deleted: deletedCount,
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Toggle or grant user VIP / Premium membership
// @route   PUT /api/admin/users/:id/toggle-vip
// @access  Private (Admin)
const toggleUserVip = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const { action, planId, durationDays } = req.body || {};

  // If explicitly revoking or toggling an already premium user without a new grant plan
  const shouldRevoke = action === 'revoke' || (!action && user.isPremium && !planId);

  if (shouldRevoke) {
    user.isPremium = false;
    user.subscriptionStatus = 'none';
    user.subscriptionPlan = '';
    user.subscriptionExpiresAt = null;
    user.subscriptionDurationDays = 0;
    user.vipGrantedBy = 'none';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `VIP Membership revoked for ${user.name || user.phoneNumber}`,
      data: user,
    });
  }

  // Granting VIP
  user.isPremium = true;
  user.subscriptionStatus = 'active';
  user.vipGrantedBy = 'admin';

  let selectedPlanId = planId || '30days';
  let days = Number(durationDays);

  if (isNaN(days)) {
    if (selectedPlanId === '7days') days = 7;
    else if (selectedPlanId === '30days') days = 30;
    else if (selectedPlanId === '1year') days = 365;
    else if (selectedPlanId === 'lifetime') days = 0;
    else {
      const pricing = await PricingSetting.findOne();
      const p = pricing?.plans?.find((item) => item.id === selectedPlanId);
      days = p ? Number(p.durationDays) || 30 : 30;
    }
  }

  user.subscriptionPlan = selectedPlanId;
  user.subscriptionDurationDays = days;

  if (days > 0) {
    const exp = new Date();
    exp.setDate(exp.getDate() + days);
    user.subscriptionExpiresAt = exp;
  } else {
    // 0 means permanent / lifetime
    user.subscriptionExpiresAt = null;
  }

  await user.save();

  const planLabel = selectedPlanId === 'lifetime'
    ? 'Lifetime VIP'
    : days > 0
    ? `${days} Days VIP Pass`
    : 'Active VIP';

  res.status(200).json({
    success: true,
    message: `${planLabel} granted successfully to ${user.name || user.phoneNumber}`,
    data: user,
  });
});

// @desc    Restore deleted user account
// @route   PUT /api/admin/users/:id/restore
// @access  Private (Admin)
const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.isDeleted = false;
  user.deletedAt = null;
  user.deletionReason = '';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account restored successfully',
    data: user,
  });
});

// @desc    Get single user details with transaction history
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const purchases = await Purchase.find({ userId: user._id })
    .populate('templateId', 'name thumbnail price accessType')
    .sort({ createdAt: -1 });

  const analyticsEvents = await Analytics.find({ userId: user._id })
    .populate('templateId', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  const totalSpent = purchases
    .filter((p) => p.status === 'successful')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      user,
      purchases,
      analyticsEvents,
      metrics: {
        totalPurchases: purchases.filter((p) => p.status === 'successful').length,
        totalSpent,
      },
    },
  });
});

// @desc    Get user subscriptions listing for admin
// @route   GET /api/admin/subscriptions
// @access  Private (Admin)
const getSubscriptions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const { search, status = 'all' } = req.query;

  let query = {
    $or: [
      { isPremium: true },
      { subscriptionStatus: { $in: ['active', 'expired', 'cancelled'] } },
    ],
  };

  if (status === 'active') {
    query.subscriptionStatus = 'active';
  } else if (status === 'expired') {
    query.subscriptionStatus = 'expired';
  } else if (status === 'cancelled') {
    query.subscriptionStatus = 'cancelled';
  }

  if (search) {
    query.$and = [
      {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ],
      },
    ];
  }

  const total = await User.countDocuments(query);
  const activeCount = await User.countDocuments({ isPremium: true, subscriptionStatus: 'active' });
  const users = await User.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);

  const usersWithSubDetails = await Promise.all(
    users.map(async (u) => {
      const userPurchases = await Purchase.find({ userId: u._id, status: 'successful' }).sort({ createdAt: -1 });
      const totalSpent = userPurchases.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const vipPurchase = userPurchases.find((p) => p.purchaseType === 'vip_subscription' || p.productId?.startsWith('vip') || p.productId === 'starpix_vip_unlock');

      const userObj = u.toObject();
      userObj.totalSpent = totalSpent;
      userObj.totalPurchases = userPurchases.length;
      userObj.subscribedAt = vipPurchase ? vipPurchase.createdAt : u.updatedAt;
      userObj.latestTransaction = userPurchases[0] || null;
      userObj.subscriptionPlan = u.subscriptionPlan || (u.isPremium ? 'active_vip' : '');
      userObj.subscriptionExpiresAt = u.subscriptionExpiresAt;
      userObj.subscriptionDurationDays = u.subscriptionDurationDays;
      userObj.vipGrantedBy = u.vipGrantedBy;
      userObj.profilePhoto = u.profilePhoto;
      return userObj;
    })
  );

  const allVipPurchases = await Purchase.find({
    status: 'successful',
    $or: [
      { purchaseType: 'vip_subscription' },
      { productId: { $regex: /vip/i } },
      { productId: 'starpix_vip_unlock' },
    ],
  });
  const totalSubRevenue = allVipPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);

  res.status(200).json({
    success: true,
    data: usersWithSubDetails,
    summary: {
      totalSubscriptions: total,
      activeSubscriptions: activeCount,
      totalSubRevenue,
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Get account deletion audit logs
// @route   GET /api/admin/deletion-logs
// @access  Private (Admin)
const getDeletionLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const { search } = req.query;

  let query = {};
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { reason: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await DeletionLog.countDocuments(query);
  const logs = await DeletionLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Get all user generated AI content & creations for Admin Panel
// @route   GET /api/admin/creations
// @access  Private (Admin)
const getAdminCreations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const { search, mediaType, type } = req.query;

  const conditions = [];

  if (type === 'ai') {
    conditions.push({
      $or: [{ isAi: true }, { aiTemplateId: { $ne: null } }],
    });
  } else if (type === 'non-ai' || type === 'standard' || type === 'template') {
    conditions.push({
      isAi: { $ne: true },
      aiTemplateId: null,
    });
  }

  if (mediaType && mediaType !== 'all') {
    conditions.push({ mediaType });
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    conditions.push({
      $or: [
        { templateTitle: { $regex: term, $options: 'i' } },
        { format: { $regex: term, $options: 'i' } },
      ],
    });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const Creation = require('../models/Creation');
  const total = await Creation.countDocuments(query);
  const creations = await Creation.find(query)
    .populate('userId', 'name phoneNumber profilePhoto')
    .populate('templateId', 'name thumbnail price accessType')
    .populate('aiTemplateId', 'title thumbnailUrl sampleResultVideoUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: creations,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

module.exports = {
  getUsers,
  toggleUserVip,
  restoreUser,
  getUserDetails,
  getSubscriptions,
  getDeletionLogs,
  getAdminCreations,
};
