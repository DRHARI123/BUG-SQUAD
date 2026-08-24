const express = require('express');
const router = express.Router();
const {
  getBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  changeBugStatus,
  assignBug,
  getBugHistory,
  getBugComments,
  addBugComment,
  deleteBugComment,
} = require('../controllers/bugController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getBugs)
  .post(protect, createBug);

router
  .route('/:id')
  .get(protect, getBugById)
  .put(protect, updateBug)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteBug);

router.patch('/:id/status', protect, changeBugStatus);
router.patch('/:id/assign', protect, assignBug);
router.get('/:id/history', protect, getBugHistory);

router
  .route('/:id/comments')
  .get(protect, getBugComments)
  .post(protect, addBugComment);

router.delete('/:id/comments/:commentId', protect, deleteBugComment);

module.exports = router;
