const asyncHandler = require('../utils/asyncHandler');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Template = require('../models/Template');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');
const Frame = require('../models/Frame');
const Effect = require('../models/Effect');
const Campaign = require('../models/Campaign');

// @desc    Track analytics event from mobile client
// @route   POST /api/analytics/event
// @access  Public / Private
const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, templateId, meta } = req.body;
  const userId = req.user ? req.user._id : null;

  if (!eventType) {
    return res.status(400).json({ success: false, message: 'Event type is required' });
  }

  await Analytics.create({
    eventType,
    userId,
    templateId: templateId || null,
    meta: meta || {},
  });

  res.status(200).json({ success: true });
});

// @desc    Get dashboard metrics for Admin Panel
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const vipUsers = await User.countDocuments({ isPremium: true });
  const freeUsers = totalUsers - vipUsers;

  const totalTemplates = await Template.countDocuments();
  const activeTemplates = await Template.countDocuments({ active: true });
  const premiumTemplates = await Template.countDocuments({ accessType: { $in: ['premium', 'vip', 'paid'] } });
  const freeTemplates = totalTemplates - premiumTemplates;

  const totalCategories = await Category.countDocuments();
  const totalFrames = await Frame.countDocuments();
  const totalEffects = await Effect.countDocuments();
  const totalCampaigns = await Campaign.countDocuments();

  const totalPurchases = await Purchase.countDocuments({ status: 'successful' });

  const revenueResult = await Purchase.aggregate([
    { $match: { status: 'successful' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  // Real event metrics breakdown
  const eventBreakdown = await Analytics.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
  ]);

  const eventCounts = {};
  eventBreakdown.forEach((item) => {
    eventCounts[item._id] = item.count;
  });

  const topTemplates = await Template.find({ active: true })
    .sort({ uses: -1, views: -1 })
    .limit(8)
    .populate('categoryId', 'name icon')
    .select('name thumbnail uses views accessType price categoryId active');

  const topCategories = await Category.find({ active: true })
    .limit(8)
    .select('name icon thumbnail sortOrder');

  const recentPurchases = await Purchase.find()
    .populate('userId', 'name phoneNumber isPremium')
    .populate('templateId', 'name thumbnail price previewAsset mainMedia')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentEvents = await Analytics.find()
    .populate('userId', 'name phoneNumber')
    .populate('templateId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        vipUsers,
        freeUsers,
        totalTemplates,
        activeTemplates,
        premiumTemplates,
        freeTemplates,
        totalCategories,
        totalFrames,
        totalEffects,
        totalCampaigns,
        totalPurchases,
        totalRevenue,
        conversionRate: totalUsers > 0 ? ((totalPurchases / totalUsers) * 100).toFixed(1) : '0',
        eventCounts,
      },
      topTemplates,
      topCategories,
      recentPurchases,
      recentEvents,
    },
  });
});

module.exports = {
  trackEvent,
  getDashboardStats,
};
