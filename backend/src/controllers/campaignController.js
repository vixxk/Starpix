const asyncHandler = require('../utils/asyncHandler');
const Campaign = require('../models/Campaign');

// @desc    Get all campaigns (Admin view & list)
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({})
    .populate('featuredTemplates')
    .populate('featuredCategories')
    .sort({ active: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: campaigns,
  });
});

// @desc    Get all active campaigns for user home feed
// @route   GET /api/campaigns/active
// @access  Public
const getActiveCampaigns = asyncHandler(async (req, res) => {
  const now = new Date();
  const campaigns = await Campaign.find({
    active: true,
    $and: [
      { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
      { $or: [{ endDate: { $gte: now } }, { endDate: null }] },
    ],
  })
    .populate('featuredTemplates')
    .populate('featuredCategories')
    .sort({ priority: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: campaigns,
  });
});

// @desc    Get active opening campaign (App splash/opening experience)
// @route   GET /api/campaigns/active-opening
// @access  Public
const getActiveOpeningCampaign = asyncHandler(async (req, res) => {
  const now = new Date();
  let campaign = await Campaign.findOne({
    active: true,
    showOnAppOpening: true,
    $and: [
      { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
      { $or: [{ endDate: { $gte: now } }, { endDate: null }] },
    ],
  })
    .populate('featuredTemplates')
    .populate('featuredCategories')
    .sort({ priority: -1, createdAt: -1 });

  // Fallback: If no campaign is explicitly flagged for auto-opening, pick the latest active one
  if (!campaign) {
    campaign = await Campaign.findOne({
      active: true,
      $and: [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] },
      ],
    })
      .populate('featuredTemplates')
      .populate('featuredCategories')
      .sort({ priority: -1, createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    data: campaign || null,
  });
});

// @desc    Get single campaign by ID (mobile campaign detail page)
// @route   GET /api/campaigns/:id
// @access  Public
const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('featuredTemplates')
    .populate('featuredCategories');

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  res.status(200).json({
    success: true,
    data: campaign,
  });
});

// @desc    Create campaign (Admin)
// @route   POST /api/campaigns
// @access  Private (Admin)
const createCampaign = asyncHandler(async (req, res) => {
  const campaignData = {
    ...req.body,
    active: req.body.active !== undefined ? req.body.active : true,
    showOnAppOpening: Boolean(req.body.showOnAppOpening),
  };

  if (campaignData.showOnAppOpening) {
    // Only 1 campaign automatically opens when app opens - clear flag from others
    await Campaign.updateMany({}, { showOnAppOpening: false });
  }

  const campaign = await Campaign.create(campaignData);

  res.status(201).json({
    success: true,
    data: campaign,
  });
});

// @desc    Update campaign (Admin)
// @route   PUT /api/campaigns/:id
// @access  Private (Admin)
const updateCampaign = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.showOnAppOpening) {
    // Only 1 campaign automatically opens when app opens - clear flag from others
    await Campaign.updateMany({ _id: { $ne: req.params.id } }, { showOnAppOpening: false });
  }

  const campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).populate('featuredTemplates');

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  res.status(200).json({
    success: true,
    data: campaign,
  });
});

// @desc    Delete campaign (Admin)
// @route   DELETE /api/campaigns/:id
// @access  Private (Admin)
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  await campaign.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Campaign deleted successfully',
  });
});

module.exports = {
  getCampaigns,
  getActiveCampaigns,
  getCampaignById,
  getActiveOpeningCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
