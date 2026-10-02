const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTrendingTemplates,
  getHomeFeed,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  recordTemplateView,
  recordTemplateUse,
} = require('../controllers/templateController');
const { protectAdmin } = require('../middleware/adminMiddleware');
const { protectUser, optionalProtectUser } = require('../middleware/authMiddleware');

router.get('/', getTemplates);
router.get('/home-feed', getHomeFeed);
router.get('/trending', getTrendingTemplates);
router.get('/:id', getTemplateById);

router.post('/:id/view', optionalProtectUser, recordTemplateView);
router.post('/:id/use', optionalProtectUser, recordTemplateUse);

router.post('/', protectAdmin, createTemplate);
router.put('/:id', protectAdmin, updateTemplate);
router.delete('/:id', protectAdmin, deleteTemplate);

router.post('/:id/favorite', protectUser, toggleFavorite);

module.exports = router;
