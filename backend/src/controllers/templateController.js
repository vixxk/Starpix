const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const Category = require('../models/Category');

// @desc    Get all templates with filtering, search, pagination
// @route   GET /api/templates
// @access  Public
const getTemplates = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const { search, categoryId, type, accessType, filter, sort, active, includeInactive } = req.query;

  const query = {};

  if (active === 'true' || active === 'published') {
    query.active = true;
  } else if (active === 'false' || active === 'unpublished') {
    query.active = false;
  } else if (includeInactive === 'true' || active === 'all') {
    // Do not set active filter to include both published and unpublished
  } else {
    // Default public behavior: only active/published
    query.active = { $ne: false };
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (type) {
    query.type = type;
  }

  if (accessType) {
    query.accessType = accessType;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  let sortOption = { isPinned: -1, order: 1, sortOrder: 1, createdAt: -1 };
  if (sort === 'trending' || filter === 'trending') {
    sortOption = { isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1, views: -1 };
  } else if (sort === 'popular') {
    sortOption = { isPinned: -1, order: 1, sortOrder: 1, uses: -1, views: -1 };
  } else if (sort === 'newest') {
    sortOption = { isPinned: -1, order: 1, sortOrder: 1, createdAt: -1 };
  } else if (sort === 'order' || sort === 'sortOrder') {
    sortOption = { isPinned: -1, order: 1, sortOrder: 1, createdAt: -1 };
  }

  const total = await Template.countDocuments(query);
  const templates = await Template.find(query)
    .populate('categoryId', 'name nameTranslations slug icon')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: templates,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

// @desc    Get trending templates
// @route   GET /api/templates/trending
// @access  Public
const getTrendingTemplates = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const templates = await Template.find({ active: { $ne: false } })
    .populate('categoryId', 'name nameTranslations slug icon')
    .sort({ isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1, uses: -1, views: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    data: templates,
  });
});

// @desc    Get curated home feed sections (trending, goodMorning, motivation, festival)
// @route   GET /api/templates/home-feed
// @access  Public
const getHomeFeed = asyncHandler(async (req, res) => {
  const allCategories = await Category.find({ active: { $ne: false } });

  const findCat = (keywords) => {
    return allCategories.find((c) =>
      keywords.some(
        (k) =>
          (c.slug && c.slug.toLowerCase().includes(k)) ||
          (c.name && c.name.toLowerCase().includes(k))
      )
    );
  };

  const gmCat = findCat(['good-morning', 'morning', 'greeting']);
  const motCat = findCat(['motivation', 'quote', 'inspiration', 'thought']);
  const festCat = findCat(['festival', 'celebration', 'diwali', 'jayanti', 'event']);

  const [trending, goodMorning, motivation, festival, allRecent] = await Promise.all([
    Template.find({ active: { $ne: false } })
      .populate('categoryId', 'name nameTranslations slug icon')
      .sort({ isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1, uses: -1, views: -1 })
      .limit(8),
    gmCat
      ? Template.find({ active: { $ne: false }, categoryId: gmCat._id })
          .populate('categoryId', 'name nameTranslations slug icon')
          .sort({ isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1 })
          .limit(6)
      : [],
    motCat
      ? Template.find({ active: { $ne: false }, categoryId: motCat._id })
          .populate('categoryId', 'name nameTranslations slug icon')
          .sort({ isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1 })
          .limit(6)
      : [],
    festCat
      ? Template.find({ active: { $ne: false }, categoryId: festCat._id })
          .populate('categoryId', 'name nameTranslations slug icon')
          .sort({ isPinned: -1, order: 1, sortOrder: 1, trendingScore: -1 })
          .limit(6)
      : [],
    Template.find({ active: { $ne: false } })
      .populate('categoryId', 'name nameTranslations slug icon')
      .sort({ isPinned: -1, order: 1, sortOrder: 1, createdAt: -1 })
      .limit(12),
  ]);

  // Fallback to recent templates if specific category sections are empty
  const finalGoodMorning = goodMorning.length > 0 ? goodMorning : allRecent.slice(0, 6);
  const finalMotivation = motivation.length > 0 ? motivation : allRecent.slice(3, 9);
  const finalFestival = festival.length > 0 ? festival : allRecent.slice(6, 12);

  res.status(200).json({
    success: true,
    data: {
      trending,
      goodMorning: finalGoodMorning,
      motivation: finalMotivation,
      festival: finalFestival,
    },
  });
});

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Public
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id)
    .populate('categoryId', 'name nameTranslations slug icon');

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Increment view count
  template.views += 1;
  template.trendingScore = template.views * 0.2 + template.uses * 0.4 + template.favoritesCount * 0.2 + template.purchasesCount * 0.2;
  await template.save();

  res.status(200).json({
    success: true,
    data: template,
  });
});

// @desc    Create template (Admin)
// @route   POST /api/templates
// @access  Private (Admin)
const createTemplate = asyncHandler(async (req, res) => {
  const templateData = req.body;

  if (!templateData.name || !templateData.categoryId || !templateData.thumbnail || !templateData.mainMedia) {
    return res.status(400).json({ success: false, message: 'Missing required template fields' });
  }

  const categoryExists = await Category.findById(templateData.categoryId);
  if (!categoryExists) {
    return res.status(404).json({ success: false, message: 'Invalid categoryId' });
  }

  const orderVal = templateData.order !== undefined ? Number(templateData.order) : (templateData.sortOrder !== undefined ? Number(templateData.sortOrder) : 0);
  templateData.order = orderVal;
  templateData.sortOrder = orderVal;

  const template = await Template.create(templateData);

  res.status(201).json({
    success: true,
    data: template,
  });
});

// @desc    Update template (Admin)
// @route   PUT /api/templates/:id
// @access  Private (Admin)
const updateTemplate = asyncHandler(async (req, res) => {
  let template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  const updateData = { ...req.body };
  if (updateData.order !== undefined || updateData.sortOrder !== undefined) {
    const orderVal = updateData.order !== undefined ? Number(updateData.order) : Number(updateData.sortOrder);
    updateData.order = orderVal;
    updateData.sortOrder = orderVal;
  }

  template = await Template.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: template,
  });
});

// @desc    Delete template (Admin)
// @route   DELETE /api/templates/:id
// @access  Private (Admin)
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  await template.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Template deleted successfully',
  });
});

// @desc    Toggle template favorite
// @route   POST /api/templates/:id/favorite
// @access  Private (User)
const toggleFavorite = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  const user = req.user;
  const targetIdStr = template._id.toString();

  const favIndex = user.favorites.findIndex((f) => {
    if (!f) return false;
    const fId = typeof f === 'object' && f._id ? f._id.toString() : f.toString();
    return fId === targetIdStr;
  });

  let isFavorited = false;
  if (favIndex >= 0) {
    user.favorites.splice(favIndex, 1);
    template.favoritesCount = Math.max(0, template.favoritesCount - 1);
  } else {
    user.favorites.push(template._id);
    template.favoritesCount += 1;
    isFavorited = true;
  }

  template.trendingScore = template.views * 0.2 + template.uses * 0.4 + template.favoritesCount * 0.2 + template.purchasesCount * 0.2;
  await user.save();
  await template.save();

  res.status(200).json({
    success: true,
    data: {
      isFavorited,
      favoritesCount: template.favoritesCount,
    },
  });
});

module.exports = {
  getTemplates,
  getTrendingTemplates,
  getHomeFeed,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
};
