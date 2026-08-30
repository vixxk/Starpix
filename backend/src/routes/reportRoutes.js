const express = require('express');
const router = express.Router();
const { createReport, getMyReports } = require('../controllers/reportController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/', protectUser, createReport);
router.get('/my-reports', protectUser, getMyReports);

module.exports = router;
