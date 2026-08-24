const express = require('express');
const router = express.Router();
const {
  getTestSuites,
  getTestSuiteById,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
} = require('../controllers/testSuiteController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTestSuites)
  .post(protect, authorize('Admin', 'QA Manager'), createTestSuite);

router.route('/:id')
  .get(protect, getTestSuiteById)
  .put(protect, authorize('Admin', 'QA Manager'), updateTestSuite)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteTestSuite);

module.exports = router;
