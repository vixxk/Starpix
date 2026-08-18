const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadSingleMedia, proxyImage } = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadSingleMedia);
router.get('/proxy-image', proxyImage);

module.exports = router;
