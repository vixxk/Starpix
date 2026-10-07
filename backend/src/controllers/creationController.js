const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Creation = require('../models/Creation');
const Analytics = require('../models/Analytics');
const { uploadToS3, getSignedDownloadUrl } = require('../services/s3Service');
const { renderPersonalizedTemplate } = require('../services/videoRenderingService');

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
    isAi: false,
    downloadedAt: new Date(),
  });

  if (template) {
    template.uses = (template.uses || 0) + 1;
    template.trendingScore = (template.views || 0) * 0.2 + template.uses * 0.4 + (template.favoritesCount || 0) * 0.2 + (template.purchasesCount || 0) * 0.2;
    await template.save();
  }

  try {
    await Analytics.create({ eventType: 'template_download', userId, templateId: templateId || null });
    if (editedPhoto || customizationState?.userPhotoUri) {
      await Analytics.create({ eventType: 'photo_upload', userId, templateId: templateId || null });
    }
  } catch (e) {}

  const populated = await Creation.findById(creation._id).populate('templateId', 'name nameTranslations thumbnail previewAsset mainMedia canvasConfig layers categoryId type accessType price footers');

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
      select: 'name nameTranslations thumbnail previewAsset mainMedia canvasConfig layers categoryId type accessType price footers',
      populate: {
        path: 'categoryId',
        select: 'name icon',
      },
    })
    .populate({
      path: 'aiTemplateId',
      select: 'title thumbnailUrl sampleSourceImageUrl mediaType videoUrl',
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
// @route   GET or POST /api/creations/:templateId/download
// @access  Public (free) / Private (User)
const downloadCreation = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user ? req.user._id : null;

  const template = await Template.findById(templateId);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Check entitlement before authorizing download
  let isAuthorized = false;

  if (template.accessType === 'free') {
    isAuthorized = true;
  } else if (userId) {
    const user = await User.findById(userId);
    const hasLifetimeAccess = Boolean(
      (user && user.purchasedTemplates && user.purchasedTemplates.some((id) => id.toString() === templateId.toString())) ||
      await Purchase.findOne({
        userId,
        templateId,
        status: 'successful',
      })
    );

    if (hasLifetimeAccess) {
      isAuthorized = true;
      if (user && (!user.purchasedTemplates || !user.purchasedTemplates.some((id) => id.toString() === templateId.toString()))) {
        await User.findByIdAndUpdate(userId, { $addToSet: { purchasedTemplates: templateId } });
      }
    } else if (user && user.isPremium && user.subscriptionStatus === 'active') {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Purchase required to download this premium template creation.',
      errorCode: 'ENTITLEMENT_REQUIRED',
    });
  }

  const {
    userNameText,
    userQuoteText,
    userPhotoUri,
    selectedFooter,
    photoTransform,
    nameTransform,
    customizationState,
    withPersonalization,
  } = { ...(req.query || {}), ...(req.body || {}) };

  const customState = customizationState || {};
  const isPersonalized = withPersonalization !== false && withPersonalization !== 'false';
  const effectiveUserName = !isPersonalized
    ? ''
    : (userNameText !== undefined
        ? userNameText
        : (customState.userNameText !== undefined
            ? customState.userNameText
            : (req.user ? (req.user.name || req.user.displayName) : '')));
  const effectiveUserPhoto = !isPersonalized
    ? null
    : (userPhotoUri !== undefined
        ? userPhotoUri
        : (customState.userPhotoUri !== undefined
            ? customState.userPhotoUri
            : (req.user ? req.user.profilePhoto : null)));
  const isNoneFooter =
    selectedFooter === 'none' ||
    selectedFooter === null ||
    selectedFooter === false ||
    selectedFooter?.isNone === true ||
    customState.selectedFooter === 'none' ||
    customState.selectedFooter === null ||
    customState.selectedFooter === false ||
    customState.selectedFooter?.isNone === true ||
    customState.selectedFrame === 'none';

  const effectiveFooter = isNoneFooter
    ? null
    : (selectedFooter !== undefined && selectedFooter !== null
        ? selectedFooter
        : (customState.selectedFooter !== undefined && customState.selectedFooter !== null
            ? customState.selectedFooter
            : (template.footers && template.footers.length > 0 ? template.footers[0] : null)));

  let downloadUrl = null;
  let isVideoResult = Boolean(template.type === 'video');
  let outputFormat = isVideoResult ? 'mp4' : 'jpg';

  try {
    const rendered = await renderPersonalizedTemplate({
      template,
      userNameText: effectiveUserName,
      userQuoteText: userQuoteText || customState.userQuoteText || '',
      userPhotoUri: effectiveUserPhoto,
      selectedFooter: effectiveFooter,
      withPersonalization: isPersonalized,
      photoTransform: photoTransform || customState.photoTransform || {},
      nameTransform: nameTransform || customState.nameTransform || {},
      req,
    });

    if (rendered && rendered.downloadUrl) {
      downloadUrl = rendered.downloadUrl;
      isVideoResult = rendered.isVideo;
      outputFormat = rendered.format;
    }
  } catch (renderErr) {
    console.warn('[CreationController] Error in personalized render, falling back to raw media:', renderErr.message);
  }

  if (!downloadUrl) {
    downloadUrl = await getSignedDownloadUrl(template.mainMedia, 300);
  }

  res.status(200).json({
    success: true,
    data: {
      downloadUrl,
      shareUrl: downloadUrl,
      expiresInSeconds: 300,
      format: outputFormat,
      isVideo: isVideoResult,
      watermarkRemoved: true,
      message: 'Check out my personalized status creation on Starpix!',
    },
  });
});

// @desc    Authorize and prepare share link for creation
// @route   POST /api/creations/:templateId/share
// @access  Public (free) / Private (User)
const shareCreation = asyncHandler(async (req, res) => {
  // Sharing requires the exact same personalized compositing and entitlement check as download
  return downloadCreation(req, res);
});

module.exports = {
  saveCreationDownload,
  getUserDownloads,
  deleteCreation,
  clearAllDownloads,
  downloadCreation,
  shareCreation,
};
