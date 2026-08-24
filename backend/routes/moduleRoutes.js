const express = require('express');
const router = express.Router();
const {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getModules)
  .post(protect, authorize('Admin', 'QA Manager'), createModule);

router
  .route('/:id')
  .get(protect, getModuleById)
  .put(protect, authorize('Admin', 'QA Manager'), updateModule)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteModule);

module.exports = router;
