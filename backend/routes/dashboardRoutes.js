const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities,
  getRecentBugs,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/charts', protect, getDashboardCharts);
router.get('/recent-activity', protect, getRecentActivities);
router.get('/recent-bugs', protect, getRecentBugs);

module.exports = router;
