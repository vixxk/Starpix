const express = require('express');
const router = express.Router();
const { getEffects, createEffect, updateEffect, deleteEffect } = require('../controllers/effectController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.get('/', getEffects);
router.post('/', protectAdmin, createEffect);
router.put('/:id', protectAdmin, updateEffect);
router.delete('/:id', protectAdmin, deleteEffect);

module.exports = router;
