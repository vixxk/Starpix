const express = require('express');
const router = express.Router();
const { adminLogin, getAdminMe, adminLogout } = require('../controllers/adminAuthController');
const { getUsers, toggleUserVip, getUserDetails, restoreUser, getSubscriptions } = require('../controllers/adminUsersController');
const { getAllPurchases, getRevenueReport } = require('../controllers/adminPurchasesController');
const { getAdminReports, updateReportStatus, deleteReport } = require('../controllers/adminReportsController');
const { protectAdmin } = require('../middleware/adminMiddleware');

// Auth routes
router.post('/auth/login', adminLogin);
router.get('/auth/me', protectAdmin, getAdminMe);
router.post('/auth/logout', protectAdmin, adminLogout);

// Admin platform management routes
router.get('/users', protectAdmin, getUsers);
router.get('/subscriptions', protectAdmin, getSubscriptions);
router.get('/users/:id', protectAdmin, getUserDetails);
router.put('/users/:id/toggle-vip', protectAdmin, toggleUserVip);
router.put('/users/:id/restore', protectAdmin, restoreUser);

router.get('/purchases', protectAdmin, getAllPurchases);
router.get('/reports/revenue', protectAdmin, getRevenueReport);

// Admin user reports & issue tickets
router.get('/reports', protectAdmin, getAdminReports);
router.put('/reports/:id', protectAdmin, updateReportStatus);
router.delete('/reports/:id', protectAdmin, deleteReport);

module.exports = router;
