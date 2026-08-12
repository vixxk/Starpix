const express = require('express');
const router = express.Router();
const { createPayment, verifyEntitlement, getMyPurchases } = require('../controllers/paymentController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/create', protectUser, createPayment);
router.get('/verify/:templateId', protectUser, verifyEntitlement);
router.get('/my-purchases', protectUser, getMyPurchases);

module.exports = router;
