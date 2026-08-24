const express = require('express');
const router = express.Router();
const {
  getReleases,
  getReleaseById,
  createRelease,
  signOffRelease,
  updateRelease,
  deleteRelease,
} = require('../controllers/releaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getReleases)
  .post(protect, authorize('Admin', 'QA Manager'), createRelease);

router.post('/:id/sign-off', protect, authorize('Admin', 'QA Manager'), signOffRelease);

router.route('/:id')
  .get(protect, getReleaseById)
  .put(protect, authorize('Admin', 'QA Manager'), updateRelease)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteRelease);

module.exports = router;
