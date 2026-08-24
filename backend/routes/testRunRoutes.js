const express = require('express');
const router = express.Router();
const {
  getTestRuns,
  getTestRunById,
  createTestRun,
  executeTestCaseInRun,
  updateTestRun,
  deleteTestRun,
} = require('../controllers/testRunController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTestRuns)
  .post(protect, authorize('Admin', 'QA Manager', 'Tester'), createTestRun);

router.post('/:id/execute', protect, executeTestCaseInRun);

router.route('/:id')
  .get(protect, getTestRunById)
  .put(protect, authorize('Admin', 'QA Manager'), updateTestRun)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteTestRun);

module.exports = router;
