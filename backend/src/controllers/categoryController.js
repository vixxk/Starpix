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

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
