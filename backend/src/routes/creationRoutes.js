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
const { protectUser, optionalProtectUser } = require('../middleware/authMiddleware');

router.post('/save-download', protectUser, saveCreationDownload);
router.get('/my-downloads', protectUser, getUserDownloads);
router.delete('/clear-all', protectUser, clearAllDownloads);
router.delete('/:id', protectUser, deleteCreation);

router.route('/:templateId/download')
  .get(optionalProtectUser, downloadCreation)
  .post(optionalProtectUser, downloadCreation);

router.post('/:templateId/share', optionalProtectUser, shareCreation);

module.exports = router;
