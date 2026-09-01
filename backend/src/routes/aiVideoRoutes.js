const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { optionalProtectUser } = require('../middleware/authMiddleware');
const {
  getAIVideoTemplates,
  generateAIVideo,
  adminUploadAsset,
  adminGetTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
} = require('../controllers/aiVideoController');

// Public & User Endpoints
router.get('/templates', getAIVideoTemplates);
router.post('/generate', optionalProtectUser, generateAIVideo);
router.post('/swap-face', optionalProtectUser, generateAIVideo);

// Admin Management Endpoints
router.post('/admin/upload', upload.single('file'), adminUploadAsset);
router.get('/admin/templates', adminGetTemplates);
router.post('/admin/templates', adminCreateTemplate);
router.put('/admin/templates/:id', adminUpdateTemplate);
router.delete('/admin/templates/:id', adminDeleteTemplate);

module.exports = router;
