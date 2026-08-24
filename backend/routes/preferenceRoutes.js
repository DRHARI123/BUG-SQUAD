const express = require('express');
const router = express.Router();
const { getUserPreferences, updateUserPreferences } = require('../controllers/preferenceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getUserPreferences)
  .put(protect, updateUserPreferences);

module.exports = router;
