const express = require('express');
const router = express.Router();
const { adminLogin, getAdminMe, adminLogout } = require('../controllers/adminAuthController');
const { getUsers, toggleUserVip, getUserDetails } = require('../controllers/adminUsersController');
const { getAllPurchases, getRevenueReport } = require('../controllers/adminPurchasesController');
const { protectAdmin } = require('../middleware/adminMiddleware');

// Auth routes
router.post('/auth/login', adminLogin);
router.get('/auth/me', protectAdmin, getAdminMe);
router.post('/auth/logout', protectAdmin, adminLogout);

// Admin platform management routes
router.get('/users', protectAdmin, getUsers);
router.get('/users/:id', protectAdmin, getUserDetails);
router.put('/users/:id/toggle-vip', protectAdmin, toggleUserVip);
router.get('/purchases', protectAdmin, getAllPurchases);
router.get('/reports/revenue', protectAdmin, getRevenueReport);

module.exports = router;
