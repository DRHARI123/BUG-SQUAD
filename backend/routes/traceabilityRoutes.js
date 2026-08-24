const express = require('express');
const router = express.Router();
const { getTraceabilityMatrix } = require('../controllers/traceabilityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTraceabilityMatrix);

module.exports = router;
