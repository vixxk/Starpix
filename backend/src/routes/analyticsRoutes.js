const express = require('express');
const router = express.Router();
const { trackEvent, getDashboardStats } = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.post('/event', trackEvent);
router.get('/dashboard', protectAdmin, getDashboardStats);

module.exports = router;
