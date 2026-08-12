const express = require('express');
const router = express.Router();
const { downloadCreation, shareCreation } = require('../controllers/creationController');
const { protectUser } = require('../middleware/authMiddleware');

router.get('/:templateId/download', protectUser, downloadCreation);
router.post('/:templateId/share', protectUser, shareCreation);

module.exports = router;
