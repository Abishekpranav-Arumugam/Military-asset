const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize, auditLog } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get audit logs with filtering and pagination
router.get('/', auditLog('view', 'audit_log'), (req, res) => auditController.getAuditLogs(req, res));

// Get audit statistics
router.get('/stats', auditLog('view', 'audit_log'), (req, res) => auditController.getAuditStats(req, res));

// Export audit logs (admin only)
router.get(
  '/export', 
  authorize('admin'), 
  auditLog('export', 'audit_log'),
  (req, res) => auditController.exportAuditLogs(req, res)
);

module.exports = router;