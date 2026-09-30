const asyncHandler = require('../utils/asyncHandler');
const Purchase = require('../models/Purchase');

// @desc    Get all transactions / purchases for Admin Panel
// @route   GET /api/admin/purchases
// @access  Private (Admin)
const getAllPurchases = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  let query = {};
  if (status) {
    query.status = status;
  }

  const purchases = await Purchase.find(query)
    .populate('userId', 'name phoneNumber isPremium')
    .populate('templateId', 'name thumbnail price accessType previewAsset mainMedia')
    .sort({ createdAt: -1 });

  // Filter in memory if search query provided for user name, phone, template or VIP pack
  let filtered = purchases;
  if (search && search.trim() !== '') {
    const term = search.toLowerCase().trim();
    filtered = purchases.filter(
      (p) =>
        p.transactionId?.toLowerCase().includes(term) ||
        p.userId?.name?.toLowerCase().includes(term) ||
        p.userId?.phoneNumber?.includes(term) ||
        p.templateId?.name?.toLowerCase().includes(term) ||
        p.planName?.toLowerCase().includes(term) ||
        p.planId?.toLowerCase().includes(term) ||
        p.productId?.toLowerCase().includes(term)
    );
  }

  const totalRevenue = filtered
    .filter((p) => p.status === 'successful')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const successfulCount = filtered.filter((p) => p.status === 'successful').length;
  const avgOrderValue = successfulCount > 0 ? (totalRevenue / successfulCount).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      purchases: filtered,
      metrics: {
        totalCount: filtered.length,
        successfulCount,
        totalRevenue,
        avgOrderValue,
      },
    },
  });
});

// @desc    Monthly revenue report — totals per month, per template & per VIP pack
// @route   GET /api/admin/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private (Admin)
const getRevenueReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const match = { status: 'successful' };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  const [monthly, byTemplate, byVipPack] = await Promise.all([
    // Totals per calendar month
    Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Totals per template (with name/thumbnail via lookup) - only for actual template purchases
    Purchase.aggregate([
      { $match: { ...match, templateId: { $ne: null } } },
      {
        $group: {
          _id: '$templateId',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template',
        },
      },
      { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
      { $sort: { revenue: -1 } },
    ]),
    // Totals per VIP Subscription Pack
    Purchase.aggregate([
      {
        $match: {
          ...match,
          $or: [
            { purchaseType: 'vip_subscription' },
            { templateId: null },
            { productId: { $regex: /vip/i } },
            { productId: 'starpix_vip_unlock' },
          ],
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$planId', '$productId'] },
          planName: { $first: { $ifNull: ['$planName', '$productId'] } },
          amount: { $first: '$amount' },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const totalTransactions = monthly.reduce((sum, m) => sum + m.count, 0);
  const totalUnlocks = byTemplate.reduce((sum, t) => sum + t.count, 0);
  const templateRevenue = byTemplate.reduce((sum, t) => sum + t.revenue, 0);
  const totalVipCount = byVipPack.reduce((sum, v) => sum + v.count, 0);
  const totalVipRevenue = byVipPack.reduce((sum, v) => sum + v.revenue, 0);

  res.status(200).json({
    success: true,
    data: {
      range: { from: from || null, to: to || null },
      summary: {
        totalRevenue,
        totalTransactions,
        totalUnlocks,
        templateRevenue,
        totalVipCount,
        totalVipRevenue,
        monthCount: monthly.length,
        templateCount: byTemplate.length,
      },
      monthly,
      byTemplate,
      byVipPack,
    },
  });
});

module.exports = {
  getAllPurchases,
  getRevenueReport,
};
