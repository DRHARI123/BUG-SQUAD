const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAuditLogs,
  getAdminSettings,
  updateAdminSettings,
  getAISettings,
  updateAISettings,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('Admin'), getAdminStats);
router.get('/activity', protect, authorize('Admin'), getAuditLogs);
router.route('/settings')
  .get(protect, authorize('Admin'), getAdminSettings)
  .put(protect, authorize('Admin'), updateAdminSettings);

router.route('/ai-settings')
  .get(protect, authorize('Admin'), getAISettings)
  .put(protect, authorize('Admin'), updateAISettings);

module.exports = router;
