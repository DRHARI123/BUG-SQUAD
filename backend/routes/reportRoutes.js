const express = require('express');
const router = express.Router();
const {
  getSummaryReport,
  getBugReport,
  getProjectReport,
  getTesterPerformanceReport,
  getExecutionReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getSummaryReport);
router.get('/bugs', protect, getBugReport);
router.get('/projects', protect, getProjectReport);
router.get('/tester-performance', protect, getTesterPerformanceReport);
router.get('/executions', protect, getExecutionReport);

module.exports = router;
