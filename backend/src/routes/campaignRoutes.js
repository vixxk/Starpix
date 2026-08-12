const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getActiveOpeningCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { protectAdmin } = require('../middleware/adminMiddleware');

router.get('/', getCampaigns);
router.get('/active-opening', getActiveOpeningCampaign);
router.post('/', protectAdmin, createCampaign);
router.put('/:id', protectAdmin, updateCampaign);
router.delete('/:id', protectAdmin, deleteCampaign);

module.exports = router;
