const express = require('express');
const router = express.Router();
const {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
} = require('../controllers/scenarioController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getScenarios)
  .post(protect, createScenario);

router
  .route('/:id')
  .get(protect, getScenarioById)
  .put(protect, updateScenario)
  .delete(protect, authorize('Admin', 'QA Manager'), deleteScenario);

module.exports = router;
