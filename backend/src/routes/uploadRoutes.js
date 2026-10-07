const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadSingleMedia, proxyImage, removeImageBackground } = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadSingleMedia);
router.post('/remove-bg', upload.single('file'), removeImageBackground);
router.get('/proxy-image', proxyImage);

module.exports = router;
