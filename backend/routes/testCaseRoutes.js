const express = require('express');
const router = express.Router();
const {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  duplicateTestCase,
  getTestExecutions,
  executeTestCase,
} = require('../controllers/testCaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getTestCases)
  .post(protect, createTestCase);

router
  .route('/:id')
  .get(protect, getTestCaseById)
  .put(protect, updateTestCase)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteTestCase);

router.post('/:id/duplicate', protect, duplicateTestCase);

router
  .route('/:id/executions')
  .get(protect, getTestExecutions)
  .post(protect, executeTestCase);

module.exports = router;
