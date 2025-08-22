const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const { authenticate, auditLog } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/deployments - Get all deployments with filtering
router.get('/', auditLog('view', 'deployment'), (req, res) => deploymentController.getDeployments(req, res));

// GET /api/deployments/stats - Get deployment statistics
router.get('/stats', auditLog('view', 'deployment'), (req, res) => deploymentController.getDeploymentStats(req, res));

// GET /api/deployments/:id - Get deployment by ID
router.get('/:id', auditLog('view', 'deployment'), (req, res) => deploymentController.getDeploymentById(req, res));

// POST /api/deployments - Create new deployment
router.post('/', auditLog('create', 'deployment'), (req, res) => deploymentController.createDeployment(req, res));

// PUT /api/deployments/:id - Update deployment
router.put('/:id', auditLog('update', 'deployment'), (req, res) => deploymentController.updateDeployment(req, res));

// DELETE /api/deployments/:id - Delete deployment
router.delete('/:id', auditLog('delete', 'deployment'), (req, res) => deploymentController.deleteDeployment(req, res));

// POST /api/deployments/:id/personnel - Add personnel to deployment
router.post('/:id/personnel', auditLog('update', 'deployment'), (req, res) => deploymentController.addPersonnel(req, res));

// POST /api/deployments/:id/assets - Add assets to deployment
router.post('/:id/assets', auditLog('update', 'deployment'), (req, res) => deploymentController.addAssets(req, res));

// PUT /api/deployments/:id/status - Update deployment status
router.put('/:id/status', auditLog('update', 'deployment'), (req, res) => deploymentController.updateStatus(req, res));

module.exports = router;