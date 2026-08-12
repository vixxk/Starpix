const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', protectAdmin, createCategory);
router.put('/:id', protectAdmin, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;
