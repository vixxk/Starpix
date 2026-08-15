const express = require('express');
const router = express.Router();
const {
  saveCreationDownload,
  getUserDownloads,
  deleteCreation,
  clearAllDownloads,
  downloadCreation,
  shareCreation,
} = require('../controllers/creationController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/save-download', protectUser, saveCreationDownload);
router.get('/my-downloads', protectUser, getUserDownloads);
router.delete('/clear-all', protectUser, clearAllDownloads);
router.delete('/:id', protectUser, deleteCreation);

router.get('/:templateId/download', protectUser, downloadCreation);
router.post('/:templateId/share', protectUser, shareCreation);

module.exports = router;
