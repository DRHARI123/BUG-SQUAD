const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getUsers)
  .post(protect, authorize('Admin'), createUser);

router
  .route('/:id')
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, authorize('Admin'), deleteUser);

router.patch('/:id/status', protect, authorize('Admin'), toggleUserStatus);
router.post('/:id/reset-password', protect, authorize('Admin'), resetPassword);

module.exports = router;
