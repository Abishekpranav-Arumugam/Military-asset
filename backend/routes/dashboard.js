const express = require('express');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const {
  getDashboardMetrics,
  getMovementDetails
} = require('../controllers/dashboardController');

const router = express.Router();

// Routes
router.get('/metrics', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'dashboard'),
  getDashboardMetrics
);

router.get('/movements', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'dashboard'),
  getMovementDetails
);

module.exports = router;
