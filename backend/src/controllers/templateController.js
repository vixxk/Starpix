const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const Category = require('../models/Category');

// @desc    Get all templates with filtering, search, pagination
// @route   GET /api/templates
// @access  Public
const getTemplates = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const { search, categoryId, type, accessType, filter, sort } = req.query;

  const query = { active: true };

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

  let sortOption = { createdAt: -1 };
  if (sort === 'trending' || filter === 'trending') {
    sortOption = { isPinned: -1, trendingScore: -1, views: -1 };
  } else if (sort === 'popular') {
    sortOption = { uses: -1, views: -1 };
  } else if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  const total = await Template.countDocuments(query);
  const templates = await Template.find(query)
    .populate('categoryId', 'name slug icon')
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
  const templates = await Template.find({ active: true })
    .populate('categoryId', 'name slug icon')
    .sort({ isPinned: -1, trendingScore: -1, uses: -1, views: -1 })
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
  const categories = await Category.find({ slug: { $in: ['good-morning', 'motivation', 'festival'] } }).select('slug');
  const catIds = {};
  categories.forEach((cat) => {
    catIds[cat.slug] = cat._id;
  });

  const [trending, goodMorning, motivation, festival] = await Promise.all([
    Template.find({ active: true })
      .populate('categoryId', 'name slug icon')
      .sort({ isPinned: -1, trendingScore: -1, uses: -1, views: -1 })
      .limit(8),
    catIds['good-morning']
      ? Template.find({ active: true, categoryId: catIds['good-morning'] })
          .populate('categoryId', 'name slug icon')
          .sort({ trendingScore: -1 })
          .limit(6)
      : [],
    catIds['motivation']
      ? Template.find({ active: true, categoryId: catIds['motivation'] })
          .populate('categoryId', 'name slug icon')
          .sort({ trendingScore: -1 })
          .limit(6)
      : [],
    catIds['festival']
      ? Template.find({ active: true, categoryId: catIds['festival'] })
          .populate('categoryId', 'name slug icon')
          .sort({ trendingScore: -1 })
          .limit(6)
      : [],
  ]);

  res.status(200).json({
    success: true,
    data: {
      trending,
      goodMorning,
      motivation,
      festival,
    },
  });
});

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Public
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id).populate('categoryId', 'name slug icon');

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

  template = await Template.findByIdAndUpdate(req.params.id, req.body, {
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
  const favIndex = user.favorites.indexOf(template._id);

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
