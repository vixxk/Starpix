const express = require('express');
const router = express.Router();
const { adminLogin, getAdminMe, adminLogout } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.post('/auth/login', adminLogin);
router.get('/auth/me', protectAdmin, getAdminMe);
router.post('/auth/logout', protectAdmin, adminLogout);

module.exports = router;
