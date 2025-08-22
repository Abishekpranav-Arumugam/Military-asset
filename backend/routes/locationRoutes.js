const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, auditLog } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/locations - Get all locations with filtering
router.get('/', auditLog('view', 'location'), (req, res) => locationController.getLocations(req, res));

// GET /api/locations/stats - Get location statistics
router.get('/stats', auditLog('view', 'location'), (req, res) => locationController.getLocationStats(req, res));

// GET /api/locations/capacity-report - Get capacity report
router.get('/capacity-report', auditLog('view', 'location'), (req, res) => locationController.getCapacityReport(req, res));

// GET /api/locations/:id - Get location by ID
router.get('/:id', auditLog('view', 'location'), (req, res) => locationController.getLocationById(req, res));

// POST /api/locations - Create new location
router.post('/', auditLog('create', 'location'), (req, res) => locationController.createLocation(req, res));

// PUT /api/locations/:id - Update location
router.put('/:id', auditLog('update', 'location'), (req, res) => locationController.updateLocation(req, res));

// DELETE /api/locations/:id - Delete location
router.delete('/:id', auditLog('delete', 'location'), (req, res) => locationController.deleteLocation(req, res));

// POST /api/locations/:id/assets - Add asset to location
router.post('/:id/assets', auditLog('update', 'location'), (req, res) => locationController.addAsset(req, res));

// DELETE /api/locations/:id/assets/:assetId - Remove asset from location
router.delete('/:id/assets/:assetId', auditLog('update', 'location'), (req, res) => locationController.removeAsset(req, res));

// POST /api/locations/:id/inspections - Add inspection record
router.post('/:id/inspections', auditLog('update', 'location'), (req, res) => locationController.addInspection(req, res));

// POST /api/locations/:id/access-logs - Log access to location
router.post('/:id/access-logs', auditLog('update', 'location'), (req, res) => locationController.logAccess(req, res));

module.exports = router;