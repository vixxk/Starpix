const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadSingleMedia } = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadSingleMedia);

module.exports = router;
