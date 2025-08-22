const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authenticate, auditLog } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/incidents - Get all incidents with filtering
router.get('/', auditLog('view', 'incident'), (req, res) => incidentController.getIncidents(req, res));

// GET /api/incidents/stats - Get incident statistics
router.get('/stats', auditLog('view', 'incident'), (req, res) => incidentController.getIncidentStats(req, res));

// GET /api/incidents/:id - Get incident by ID
router.get('/:id', auditLog('view', 'incident'), (req, res) => incidentController.getIncidentById(req, res));

// POST /api/incidents - Create new incident
router.post('/', auditLog('create', 'incident'), (req, res) => incidentController.createIncident(req, res));

// PUT /api/incidents/:id - Update incident
router.put('/:id', auditLog('update', 'incident'), (req, res) => incidentController.updateIncident(req, res));

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', auditLog('delete', 'incident'), (req, res) => incidentController.deleteIncident(req, res));

// PUT /api/incidents/:id/status - Update incident status
router.put('/:id/status', auditLog('update', 'incident'), (req, res) => incidentController.updateStatus(req, res));

// POST /api/incidents/:id/investigation - Add investigation details
router.post('/:id/investigation', auditLog('update', 'incident'), (req, res) => incidentController.addInvestigation(req, res));

// POST /api/incidents/:id/corrective-actions - Add corrective action
router.post('/:id/corrective-actions', auditLog('update', 'incident'), (req, res) => incidentController.addCorrectiveAction(req, res));

module.exports = router;