const asyncHandler = require('../utils/asyncHandler');
const Effect = require('../models/Effect');

// @desc    Get all active effects
// @route   GET /api/effects
// @access  Public
const getEffects = asyncHandler(async (req, res) => {
  const query = { active: true };
  if (req.query.type) query.type = req.query.type;

  const effects = await Effect.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: effects,
  });
});

// @desc    Create effect (Admin)
// @route   POST /api/effects
// @access  Private (Admin)
const createEffect = asyncHandler(async (req, res) => {
  const { name, type, asset, thumbnail, duration, loop, intensity, configuration, active } = req.body;

  if (!name || !asset || !thumbnail) {
    return res.status(400).json({ success: false, message: 'Name, asset and thumbnail are required' });
  }

  const effect = await Effect.create({
    name,
    type: type || 'overlay',
    asset,
    thumbnail,
    duration: duration || 5,
    loop: loop !== undefined ? loop : true,
    intensity: intensity || 1,
    configuration: configuration || {},
    active: active !== undefined ? active : true,
  });

  res.status(201).json({
    success: true,
    data: effect,
  });
});

// @desc    Update effect (Admin)
// @route   PUT /api/effects/:id
// @access  Private (Admin)
const updateEffect = asyncHandler(async (req, res) => {
  const effect = await Effect.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!effect) {
    return res.status(404).json({ success: false, message: 'Effect not found' });
  }

  res.status(200).json({
    success: true,
    data: effect,
  });
});

// @desc    Delete effect (Admin)
// @route   DELETE /api/effects/:id
// @access  Private (Admin)
const deleteEffect = asyncHandler(async (req, res) => {
  const effect = await Effect.findById(req.params.id);

  if (!effect) {
    return res.status(404).json({ success: false, message: 'Effect not found' });
  }

  await effect.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Effect deleted successfully',
  });
});

module.exports = {
  getEffects,
  createEffect,
  updateEffect,
  deleteEffect,
};
