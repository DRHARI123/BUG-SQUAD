const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getProjects)
  .post(protect, authorize('Admin', 'QA Manager'), createProject);

router
  .route('/:id')
  .get(protect, getProjectById)
  .put(protect, authorize('Admin', 'QA Manager'), updateProject)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteProject);

module.exports = router;
