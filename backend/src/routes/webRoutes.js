const express = require('express');
const router = express.Router();
const { getDeleteAccount, postDeleteAccount } = require('../controllers/webController');

// GET /delete, GET /delete-account, GET /account-deletion
router.get(['/delete', '/delete-account', '/account-deletion'], getDeleteAccount);

// POST /delete, POST /delete-account, POST /account-deletion
router.post(['/delete', '/delete-account', '/account-deletion'], postDeleteAccount);

module.exports = router;
