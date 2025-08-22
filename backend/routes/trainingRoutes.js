const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { authenticate, auditLog } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/training - Get all training sessions
router.get('/', auditLog('view', 'training'), (req, res) => trainingController.getTrainingSessions(req, res));

// GET /api/training/stats - Get training statistics
router.get('/stats', auditLog('view', 'training'), (req, res) => trainingController.getTrainingStats(req, res));

// GET /api/training/upcoming - Get upcoming training sessions
router.get('/upcoming', auditLog('view', 'training'), (req, res) => trainingController.getUpcomingTraining(req, res));

// GET /api/training/:id - Get training session by ID
router.get('/:id', auditLog('view', 'training'), (req, res) => trainingController.getTrainingById(req, res));

// POST /api/training - Create new training session
router.post('/', auditLog('create', 'training'), (req, res) => trainingController.createTraining(req, res));

// PUT /api/training/:id - Update training session
router.put('/:id', auditLog('update', 'training'), (req, res) => trainingController.updateTraining(req, res));

// DELETE /api/training/:id - Delete training session
router.delete('/:id', auditLog('delete', 'training'), (req, res) => trainingController.deleteTraining(req, res));

// POST /api/training/:id/participants - Add participants
router.post('/:id/participants', auditLog('update', 'training'), (req, res) => trainingController.addParticipants(req, res));

// PUT /api/training/:id/participants/:participantId - Update participant status
router.put('/:id/participants/:participantId', auditLog('update', 'training'), (req, res) => trainingController.updateParticipantStatus(req, res));

// PUT /api/training/:id/status - Update training status
router.put('/:id/status', auditLog('update', 'training'), (req, res) => trainingController.updateStatus(req, res));

module.exports = router;