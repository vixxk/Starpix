const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Analytics = require('../models/Analytics');

// @desc    Get all registered users with metrics
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  const { search, isPremium } = req.query;

  let query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (isPremium === 'true') query.isPremium = true;
  if (isPremium === 'false') query.isPremium = false;

  const users = await User.find(query).sort({ createdAt: -1 });

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
  });
});

// @desc    Toggle user VIP / Premium membership
// @route   PUT /api/admin/users/:id/toggle-vip
// @access  Private (Admin)
const toggleUserVip = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.isPremium = !user.isPremium;
  user.subscriptionStatus = user.isPremium ? 'active' : 'none';
  await user.save();

  res.status(200).json({
    success: true,
    message: `User VIP status updated to ${user.isPremium ? 'Active VIP' : 'Free Member'}`,
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

module.exports = {
  getUsers,
  toggleUserVip,
  getUserDetails,
};
