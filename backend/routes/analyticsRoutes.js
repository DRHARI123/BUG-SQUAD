const express = require('express');
const router = express.Router();
const {
  getOverviewAnalytics,
  getBugAnalytics,
  getTeamAnalytics,
  generateAIInsights,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overview', protect, getOverviewAnalytics);
router.get('/bugs', protect, getBugAnalytics);
router.get('/team', protect, getTeamAnalytics);
router.post('/ai-insights', protect, generateAIInsights);

module.exports = router;
