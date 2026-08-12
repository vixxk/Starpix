const asyncHandler = require('../utils/asyncHandler');
const Frame = require('../models/Frame');

// @desc    Get all frames
// @route   GET /api/frames
// @access  Public
const getFrames = asyncHandler(async (req, res) => {
  const query = { active: true };
  if (req.query.category) query.category = req.query.category;
  if (req.query.contentTag) query.contentTag = req.query.contentTag;

  const frames = await Frame.find(query)
    .populate('category', 'name icon slug')
    .sort({ sortOrder: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: frames,
  });
});

// @desc    Create frame (Admin)
// @route   POST /api/frames
// @access  Private (Admin)
const createFrame = asyncHandler(async (req, res) => {
  const { name, thumbnail, asset, category, contentTag, placement, configuration, sortOrder, active } = req.body;

  if (!name || !asset || !thumbnail) {
    return res.status(400).json({ success: false, message: 'Name, asset and thumbnail image are required' });
  }

  const frame = await Frame.create({
    name,
    thumbnail,
    asset,
    category: category || null,
    contentTag: contentTag || 'general',
    placement: placement || { x: 0.5, y: 0.5, width: 1.0, height: 1.0, zIndex: 10 },
    configuration: configuration || {},
    sortOrder: sortOrder || 0,
    active: active !== undefined ? active : true,
  });

  const populated = await Frame.findById(frame._id).populate('category', 'name icon slug');

  res.status(201).json({
    success: true,
    data: populated,
  });
});

// @desc    Update frame (Admin)
// @route   PUT /api/frames/:id
// @access  Private (Admin)
const updateFrame = asyncHandler(async (req, res) => {
  const frame = await Frame.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name icon slug');

  if (!frame) {
    return res.status(404).json({ success: false, message: 'Frame not found' });
  }

  res.status(200).json({
    success: true,
    data: frame,
  });
});

// @desc    Delete frame (Admin)
// @route   DELETE /api/frames/:id
// @access  Private (Admin)
const deleteFrame = asyncHandler(async (req, res) => {
  const frame = await Frame.findById(req.params.id);

  if (!frame) {
    return res.status(404).json({ success: false, message: 'Frame not found' });
  }

  await frame.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Frame deleted successfully',
  });
});

module.exports = {
  getFrames,
  createFrame,
  updateFrame,
  deleteFrame,
};
