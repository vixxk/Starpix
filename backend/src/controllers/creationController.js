const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Creation = require('../models/Creation');
const { uploadToS3, getSignedDownloadUrl } = require('../services/s3Service');

// @desc    Record a new download/creation (uploads image to AWS S3 & saves Creation document)
// @route   POST /api/creations/save-download
// @access  Private (User)
const saveCreationDownload = asyncHandler(async (req, res) => {
  const { templateId, imageBase64, imageUrl: clientImageUrl, editedText, editedPhoto, customizationState } = req.body;
  const userId = req.user._id;

  const template = await Template.findById(templateId);
  const templateTitle = template ? template.name : 'Status Creation';

  let finalImageUrl = clientImageUrl || '';

  // If base64 image data is provided, upload directly to S3
  if (imageBase64) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const s3Url = await uploadToS3(buffer, `creation_${Date.now()}.png`, 'image/png', 'user-creations');
      if (s3Url) {
        finalImageUrl = s3Url;
      }
    } catch (err) {
      console.error('[Creation S3 Upload Error]:', err);
      // Fallback to client provided URL or template preview asset if S3 fails
      if (!finalImageUrl && template) {
        finalImageUrl = template.previewAsset || template.thumbnail;
      }
    }
  } else if (!finalImageUrl && template) {
    finalImageUrl = template.previewAsset || template.thumbnail;
  }

  const creation = await Creation.create({
    userId,
    templateId,
    templateTitle,
    editedText: editedText || '',
    editedPhoto: editedPhoto || '',
    customizationState: customizationState || {},
    imageUrl: finalImageUrl,
    downloadedAt: new Date(),
  });

  const populated = await Creation.findById(creation._id).populate('templateId', 'name thumbnail previewAsset mainMedia canvasConfig layers categoryId type accessType price');

  res.status(201).json({
    success: true,
    data: populated || creation,
  });
});

// @desc    Get user's downloaded creations list
// @route   GET /api/creations/my-downloads
// @access  Private (User)
const getUserDownloads = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const downloads = await Creation.find({ userId })
    .populate({
      path: 'templateId',
      select: 'name thumbnail previewAsset mainMedia canvasConfig layers categoryId type accessType price',
      populate: {
        path: 'categoryId',
        select: 'name icon',
      },
    })
    .sort({ downloadedAt: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: downloads,
  });
});

// @desc    Delete single creation entry
// @route   DELETE /api/creations/:id
// @access  Private (User)
const deleteCreation = asyncHandler(async (req, res) => {
  const creation = await Creation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!creation) {
    return res.status(404).json({ success: false, message: 'Creation not found' });
  }

  await creation.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Creation deleted successfully',
  });
});

// @desc    Clear all creations for user
// @route   DELETE /api/creations
// @access  Private (User)
const clearAllDownloads = asyncHandler(async (req, res) => {
  await Creation.deleteMany({ userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'All downloads cleared successfully',
  });
});

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
      message: `Check out my personalized status creation on Starpix!`,
    },
  });
});

module.exports = {
  saveCreationDownload,
  getUserDownloads,
  deleteCreation,
  clearAllDownloads,
  downloadCreation,
  shareCreation,
};
