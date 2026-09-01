const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.active !== undefined) {
    query.active = req.query.active === 'true';
  }

  const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();

  const Template = require('../models/Template');
  const templateCounts = await Template.aggregate([
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  templateCounts.forEach((tc) => {
    if (tc._id) countMap[String(tc._id)] = tc.count;
  });

  const categoriesWithCounts = categories.map((cat) => ({
    ...cat,
    templateCount: countMap[String(cat._id)] || 0,
  }));

  res.status(200).json({
    success: true,
    data: categoriesWithCounts,
  });
});

// @desc    Get category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = (await Category.findById(id).catch(() => null)) || (await Category.findOne({ slug: id }));

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, thumbnail, description, sortOrder, featured, active } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const category = await Category.create({
    name,
    slug,
    icon: icon || '✨',
    thumbnail: thumbnail || '',
    description: description || '',
    sortOrder: sortOrder || 0,
    featured: featured || false,
    active: active !== undefined ? active : true,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
});

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  if (req.body.name && req.body.name !== category.name) {
    req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// @desc    Seed default 12 categories (Admin)
// @route   POST /api/categories/seed
// @access  Private (Admin)
const seedCategories = asyncHandler(async (req, res) => {
  const defaultCategories = [
    {
      name: 'Good Morning',
      slug: 'good-morning',
      icon: '🌅',
      description: 'Daily morning blessings, quotes, and sunrise video status templates',
      sortOrder: 1,
      featured: true,
      active: true,
    },
    {
      name: 'Good Night',
      slug: 'good-night',
      icon: '🌙',
      description: 'Peaceful night wishes, sweet dreams, and evening reflections',
      sortOrder: 2,
      featured: true,
      active: true,
    },
    {
      name: 'Motivation',
      slug: 'motivation',
      icon: '💪',
      description: 'Inspiring quotes, success suvichar, and high-energy motivational reels',
      sortOrder: 3,
      featured: true,
      active: true,
    },
    {
      name: 'Devotional',
      slug: 'devotional',
      icon: '🙏',
      description: 'Divine Mahadev, Hanuman, Krishna, and daily morning prayer templates',
      sortOrder: 4,
      featured: true,
      active: true,
    },
    {
      name: 'Love & Romance',
      slug: 'love',
      icon: '❤️',
      description: 'Romantic couple status, heart effects, and affection cards',
      sortOrder: 5,
      featured: true,
      active: true,
    },
    {
      name: 'Festival & Celebration',
      slug: 'festival',
      icon: '🪔',
      description: 'Indian festival greetings, Diwali, Holi, Navratri & seasonal wishes',
      sortOrder: 6,
      featured: true,
      active: true,
    },
    {
      name: 'Birthday Wishes',
      slug: 'birthday',
      icon: '🎂',
      description: 'Happy birthday video status, confetti frames, and custom photo cards',
      sortOrder: 7,
      featured: true,
      active: true,
    },
    {
      name: 'Attitude & Swagger',
      slug: 'attitude',
      icon: '😎',
      description: 'Bold swagger reels, royal status, and high-energy background tracks',
      sortOrder: 8,
      featured: true,
      active: true,
    },
    {
      name: 'Trending Reels',
      slug: 'reels',
      icon: '🔥',
      description: 'Viral short video status templates, beat-synced motion effects',
      sortOrder: 9,
      featured: true,
      active: true,
    },
    {
      name: 'Business & Branding',
      slug: 'business',
      icon: '🚀',
      description: 'Professional business cards, daily marketing posts, and company branding',
      sortOrder: 10,
      featured: true,
      active: true,
    },
    {
      name: 'Suvichar & Quotes',
      slug: 'quotes',
      icon: '💬',
      description: 'Thought of the day, Hindi & regional wisdom, and life lessons',
      sortOrder: 11,
      featured: true,
      active: true,
    },
    {
      name: 'Anniversary & Weddings',
      slug: 'anniversary',
      icon: '🎁',
      description: 'Wedding wishes, wedding anniversary cards, and celebration status',
      sortOrder: 12,
      featured: true,
      active: true,
    },
  ];

  let seededCount = 0;
  const createdCategories = [];

  for (const cat of defaultCategories) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      const created = await Category.create(cat);
      createdCategories.push(created);
      seededCount++;
    } else {
      existing.active = true;
      await existing.save();
      createdCategories.push(existing);
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully seeded ${seededCount} new categories (${createdCategories.length} total active categories)`,
    data: createdCategories,
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
};

