const express = require('express');
const router = express.Router();
const {
  getHomePage,
  getPrivacyPolicy,
  getTermsOfService,
  getRefundPolicy,
  getContentPolicy,
  getContactPage,
  getDeleteAccount,
  postDeleteAccount,
} = require('../controllers/webController');

// GET / - Showcase landing page (or JSON health check if requested by API/curl)
router.get('/', (req, res, next) => {
  const accept = req.headers.accept || '';
  if (req.xhr || req.query.json === 'true' || (accept.includes('application/json') && !accept.includes('text/html'))) {
    return res.status(200).json({
      success: true,
      status: 'online',
      app: 'Starpix Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }
  return getHomePage(req, res);
});

// GET /privacy, /privacy-policy
router.get(['/privacy', '/privacy-policy'], getPrivacyPolicy);

// GET /terms, /terms-and-conditions, /terms-of-service, /tos
router.get(['/terms', '/terms-and-conditions', '/terms-of-service', '/tos'], getTermsOfService);

// GET /refund, /refund-policy, /cancellation-policy
router.get(['/refund', '/refund-policy', '/cancellation-policy'], getRefundPolicy);

// GET /content-policy, /ai-policy
router.get(['/content-policy', '/ai-policy'], getContentPolicy);

// GET /contact, /contact-us, /support
router.get(['/contact', '/contact-us', '/support'], getContactPage);

// GET /delete, /delete-account, /account-deletion
router.get(['/delete', '/delete-account', '/account-deletion'], getDeleteAccount);

// POST /delete, /delete-account, /account-deletion
router.post(['/delete', '/delete-account', '/account-deletion'], postDeleteAccount);

module.exports = router;
