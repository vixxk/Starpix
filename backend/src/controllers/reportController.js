const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const Template = require('../models/Template');

// @desc    Create a new report (template report or general issue)
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { type = 'issue', templateId, reason, description } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Report reason is required' });
  }

  if (type === 'template' && templateId) {
    const templateExists = await Template.findById(templateId);
    if (!templateExists) {
      return res.status(404).json({ success: false, message: 'Reported template not found' });
    }
  }

  const report = await Report.create({
    userId: req.user._id,
    type: type === 'template' ? 'template' : 'issue',
    templateId: type === 'template' ? templateId : null,
    reason: reason.trim(),
    description: description ? description.trim() : '',
    status: 'pending',
  });

  const populatedReport = await Report.findById(report._id).populate('templateId', 'name thumbnail previewAsset mainMedia');

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully. Our team will review it.',
    data: populatedReport,
  });
});

// @desc    Get user's own reports and issue tickets
// @route   GET /api/reports/my-reports
// @access  Private
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ userId: req.user._id })
    .populate('templateId', 'name thumbnail previewAsset mainMedia')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reports,
  });
});

module.exports = {
  createReport,
  getMyReports,
};
