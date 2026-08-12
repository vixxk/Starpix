const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { uploadToS3, getSignedDownloadUrl } = require('../services/s3Service');
const sharp = require('sharp');

// @desc    Download final high quality personalized creation
// @route   GET /api/creations/:templateId/download
// @access  Private (User)
const downloadCreation = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Check entitlement before authorizing download
  let isAuthorized = false;

  if (template.accessType === 'free') {
    isAuthorized = true;
  } else {
    const user = await User.findById(userId);
    if (user && user.isPremium && user.subscriptionStatus === 'active') {
      isAuthorized = true;
    } else {
      const purchase = await Purchase.findOne({
        userId,
        templateId,
        status: 'successful',
      });
      if (purchase) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Purchase required to download this premium template creation.',
      errorCode: 'ENTITLEMENT_REQUIRED',
    });
  }

  // Generate short-lived signed URL (300 seconds)
  const downloadUrl = await getSignedDownloadUrl(template.mainMedia, 300);

  res.status(200).json({
    success: true,
    data: {
      downloadUrl,
      expiresInSeconds: 300,
      format: template.type === 'video' ? 'mp4' : 'png',
      watermarkRemoved: true,
    },
  });
});

// @desc    Authorize and prepare share link for creation
// @route   POST /api/creations/:templateId/share
// @access  Private (User)
const shareCreation = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user._id;

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  let isAuthorized = false;
  if (template.accessType === 'free') {
    isAuthorized = true;
  } else {
    const purchase = await Purchase.findOne({
      userId,
      templateId,
      status: 'successful',
    });
    if (purchase) isAuthorized = true;
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Unlock creation before sharing.',
      errorCode: 'ENTITLEMENT_REQUIRED',
    });
  }

  const shareUrl = await getSignedDownloadUrl(template.mainMedia, 600);

  res.status(200).json({
    success: true,
    data: {
      shareUrl,
      message: `Check out my personalized status creation on Statuzzz!`,
    },
  });
});

module.exports = {
  downloadCreation,
  shareCreation,
};
