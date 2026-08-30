const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');

// @desc    Get all user reports and issues for admin
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getAdminReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { status, type, search } = req.query;

  let query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  if (type && type !== 'all') {
    query.type = type;
  }

  if (search) {
    query.$or = [
      { reason: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { adminResponse: { $regex: search, $options: 'i' } },
    ];
  }

  const [total, pendingCount, inProgressCount, resolvedCount, rejectedCount] = await Promise.all([
    Report.countDocuments(query),
    Report.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'in_progress' }),
    Report.countDocuments({ status: 'resolved' }),
    Report.countDocuments({ status: 'rejected' }),
  ]);

  const reports = await Report.find(query)
    .populate('userId', 'name phoneNumber countryCode profilePhoto isDeleted')
    .populate('templateId', 'name thumbnail previewAsset mainMedia accessType price description active isPinned usageCount downloadsCount type canvasConfig')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: reports,
    summary: {
      totalAll: pendingCount + inProgressCount + resolvedCount + rejectedCount,
      pending: pendingCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Update report status & admin response
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin)
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, adminResponse } = req.body;
  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  if (status) {
    if (!['pending', 'in_progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    report.status = status;
  }

  if (typeof adminResponse === 'string') {
    report.adminResponse = adminResponse.trim();
    report.adminRespondedAt = new Date();
  }

  await report.save();

  const updatedReport = await Report.findById(report._id)
    .populate('userId', 'name phoneNumber countryCode profilePhoto isDeleted')
    .populate('templateId', 'name thumbnail previewAsset mainMedia accessType price description active isPinned usageCount downloadsCount type canvasConfig');

  res.status(200).json({
    success: true,
    message: 'Report status and response updated successfully',
    data: updatedReport,
  });
});

// @desc    Delete a report
// @route   DELETE /api/admin/reports/:id
// @access  Private (Admin)
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully',
  });
});

module.exports = {
  getAdminReports,
  updateReportStatus,
  deleteReport,
};
