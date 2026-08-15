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

  // Filter in memory if search query provided for user name or phone
  let filtered = purchases;
  if (search && search.trim() !== '') {
    const term = search.toLowerCase().trim();
    filtered = purchases.filter(
      (p) =>
        p.transactionId?.toLowerCase().includes(term) ||
        p.userId?.name?.toLowerCase().includes(term) ||
        p.userId?.phoneNumber?.includes(term) ||
        p.templateId?.name?.toLowerCase().includes(term)
    );
  }

  const totalRevenue = filtered
    .filter((p) => p.status === 'successful')
    .reduce((acc, p) => {
      const isVipUser = Boolean(p.userId?.isPremium || p.amount === 0 || p.productId === 'statuzzz_vip_unlock');
      if (isVipUser) return acc;
      return acc + (p.amount || 0);
    }, 0);

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

// @desc    Monthly revenue report — totals per month & per template
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

  const [monthly, byTemplate] = await Promise.all([
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
    // Totals per template (with name/thumbnail via lookup)
    Purchase.aggregate([
      { $match: match },
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
  ]);

  const totalRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const totalUnlocks = monthly.reduce((sum, m) => sum + m.count, 0);

  res.status(200).json({
    success: true,
    data: {
      range: { from: from || null, to: to || null },
      summary: {
        totalRevenue,
        totalUnlocks,
        monthCount: monthly.length,
        templateCount: byTemplate.length,
      },
      monthly,
      byTemplate,
    },
  });
});

module.exports = {
  getAllPurchases,
  getRevenueReport,
};
