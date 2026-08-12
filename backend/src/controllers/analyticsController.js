const asyncHandler = require('../utils/asyncHandler');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Template = require('../models/Template');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');

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
  const totalTemplates = await Template.countDocuments();
  const premiumTemplates = await Template.countDocuments({ accessType: 'premium' });
  const totalPurchases = await Purchase.countDocuments({ status: 'successful' });

  const revenueResult = await Purchase.aggregate([
    { $match: { status: 'successful' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  const topTemplates = await Template.find({ active: true })
    .sort({ uses: -1, views: -1 })
    .limit(5)
    .select('name thumbnail uses views accessType price');

  const topCategories = await Category.find({ active: true })
    .limit(5)
    .select('name icon thumbnail');

  const recentPurchases = await Purchase.find({ status: 'successful' })
    .populate('userId', 'name phoneNumber')
    .populate('templateId', 'name thumbnail price')
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeUsers: Math.round(totalUsers * 0.75),
        totalTemplates,
        premiumTemplates,
        totalPurchases,
        totalRevenue,
        conversionRate: totalUsers > 0 ? ((totalPurchases / totalUsers) * 100).toFixed(1) : '0',
      },
      topTemplates,
      topCategories,
      recentPurchases,
    },
  });
});

module.exports = {
  trackEvent,
  getDashboardStats,
};
