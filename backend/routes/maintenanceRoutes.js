const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, auditLog } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get maintenance records
router.get('/', auditLog('view', 'maintenance'), (req, res) => maintenanceController.getMaintenanceRecords(req, res));

// Get maintenance statistics
router.get('/stats', auditLog('view', 'maintenance'), (req, res) => maintenanceController.getMaintenanceStats(req, res));

// Get overdue maintenance
router.get('/overdue', auditLog('view', 'maintenance'), (req, res) => maintenanceController.getOverdueMaintenance(req, res));

// Get upcoming maintenance
router.get('/upcoming', auditLog('view', 'maintenance'), (req, res) => maintenanceController.getUpcomingMaintenance(req, res));

// Get single maintenance record
router.get('/:id', auditLog('view', 'maintenance'), (req, res) => maintenanceController.getMaintenanceById(req, res));

// Create new maintenance record
router.post('/', auditLog('create', 'maintenance'), (req, res) => maintenanceController.createMaintenance(req, res));

// Update maintenance record
router.put('/:id', auditLog('update', 'maintenance'), (req, res) => maintenanceController.updateMaintenance(req, res));

// Delete maintenance record
router.delete('/:id', auditLog('delete', 'maintenance'), (req, res) => maintenanceController.deleteMaintenance(req, res));

// Add work log to maintenance
router.post('/:id/work-log', auditLog('update', 'maintenance'), (req, res) => maintenanceController.addWorkLog(req, res));

module.exports = router;