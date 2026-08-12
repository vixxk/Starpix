const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp, getMe, updateProfile } = require('../controllers/authController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protectUser, getMe);
router.put('/profile', protectUser, updateProfile);

module.exports = router;
