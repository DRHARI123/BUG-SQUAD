const express = require('express');
const router = express.Router();
const {
  aiChat,
  analyzeBug,
  generateBugSummary,
  suggestRootCause,
  checkSimilarBugs,
  generateTestCases,
  generateScenarios,
  generateTestData,
  suggestRegressionTests,
  analyzeRequirement,
  generateAcceptanceCriteria,
  analyzeRelease,
  bugTriage,
  getAIUsage,
  getAIHistory,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/chat', protect, aiChat);
router.post('/analyze-bug', protect, analyzeBug);
router.post('/bug-summary', protect, generateBugSummary);
router.post('/root-cause', protect, suggestRootCause);
router.post('/similar-bugs', protect, checkSimilarBugs);
router.post('/generate-test-cases', protect, generateTestCases);
router.post('/generate-scenarios', protect, generateScenarios);
router.post('/generate-test-data', protect, generateTestData);
router.post('/regression-tests', protect, suggestRegressionTests);
router.post('/analyze-requirement', protect, analyzeRequirement);
router.post('/acceptance-criteria', protect, generateAcceptanceCriteria);
router.post('/release-analysis', protect, analyzeRelease);
router.post('/bug-triage', protect, authorize('Admin', 'QA Manager'), bugTriage);
router.get('/usage', protect, getAIUsage);
router.get('/history', protect, getAIHistory);

module.exports = router;
