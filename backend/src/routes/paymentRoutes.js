const express = require('express');
const router = express.Router();
const { createPayment, verifyEntitlement, getMyPurchases, subscribeVip, buyCredits, getCreditTransactions } = require('../controllers/paymentController');
const { getPublicPlans } = require('../controllers/pricingController');
const { protectUser } = require('../middleware/authMiddleware');

router.get('/plans', getPublicPlans);
router.post('/create', protectUser, createPayment);
router.post('/subscribe', protectUser, subscribeVip);
router.post('/buy-credits', protectUser, buyCredits);
router.get('/credit-transactions', protectUser, getCreditTransactions);
router.get('/balance-stream', protectUser, (req, res) => {
  const { handleBalanceSSEConnection } = require('../utils/balanceSSE');
  handleBalanceSSEConnection(req, res);
});
router.get('/verify/:templateId', protectUser, verifyEntitlement);
router.get('/my-purchases', protectUser, getMyPurchases);

module.exports = router;
