const express = require('express');
const router = express.Router();
const {
  getTestPlans,
  getTestPlanById,
  createTestPlan,
  updateTestPlan,
  deleteTestPlan,
} = require('../controllers/testPlanController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTestPlans)
  .post(protect, authorize('Admin', 'QA Manager'), createTestPlan);

router.route('/:id')
  .get(protect, getTestPlanById)
  .put(protect, authorize('Admin', 'QA Manager'), updateTestPlan)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteTestPlan);

module.exports = router;
