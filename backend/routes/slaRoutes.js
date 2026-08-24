const express = require('express');
const router = express.Router();
const {
  getSLAConfigs,
  updateSLAConfigs,
  getSLADashboard,
} = require('../controllers/slaController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSLAConfigs)
  .post(protect, authorize('Admin', 'QA Manager'), updateSLAConfigs);

router.get('/dashboard', protect, getSLADashboard);

module.exports = router;
