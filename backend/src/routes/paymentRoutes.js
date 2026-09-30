const express = require('express');
const router = express.Router();
const { createPayment, verifyEntitlement, getMyPurchases, subscribeVip } = require('../controllers/paymentController');
const { getPublicPlans } = require('../controllers/pricingController');
const { protectUser } = require('../middleware/authMiddleware');

router.get('/plans', getPublicPlans);
router.post('/create', protectUser, createPayment);
router.post('/subscribe', protectUser, subscribeVip);
router.get('/verify/:templateId', protectUser, verifyEntitlement);
router.get('/my-purchases', protectUser, getMyPurchases);

module.exports = router;
