const express = require('express');
const router = express.Router();
const { getFrames, createFrame, updateFrame, deleteFrame } = require('../controllers/frameController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.get('/', getFrames);
router.post('/', protectAdmin, createFrame);
router.put('/:id', protectAdmin, updateFrame);
router.delete('/:id', protectAdmin, deleteFrame);

module.exports = router;
