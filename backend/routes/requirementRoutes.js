const express = require('express');
const router = express.Router();
const {
  getRequirements,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
} = require('../controllers/requirementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRequirements)
  .post(protect, authorize('Admin', 'QA Manager'), createRequirement);

router.route('/:id')
  .get(protect, getRequirementById)
  .put(protect, authorize('Admin', 'QA Manager'), updateRequirement)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteRequirement);

module.exports = router;
