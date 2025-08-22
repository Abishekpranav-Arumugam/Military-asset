const Training = require('../models/Training');
const Asset = require('../models/Asset');
const User = require('../models/User');
const BaseController = require('./BaseControllerClass');

class TrainingController extends BaseController {
  // Get all training sessions with filtering
  async getTrainingSessions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        trainingType,
        startDate,
        endDate,
        search
      } = req.query;

      // Build query
      let query = {};
      
      // Apply base filter
      this.applyBaseFilter(query, req.user);

      // Status filter
      if (status) {
        query.status = status;
      }

      // Training type filter
      if (trainingType) {
        query.trainingType = trainingType;
      }

      // Date range filter
      const dateRange = this.buildDateRangeQuery(startDate, endDate);
      if (dateRange) {
        query.startDate = dateRange;
      }

      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const { skip } = this.parsePagination({ page, limit });

      // Execute query
      const [trainingSessions, total] = await Promise.all([
        Training.find(query)
          .populate('instructor', 'firstName lastName rank')
          .populate('participants.userId', 'firstName lastName rank')
          .populate('equipmentUsed.assetId', 'name serialNumber type')
          .sort({ startDate: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Training.countDocuments(query)
      ]);

      res.json({
        trainingSessions,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch training sessions');
    }
  }

  // Get training session by ID
  async getTrainingById(req, res) {
    try {
      const { id } = req.params;

      const training = await Training.findById(id)
        .populate('instructor', 'firstName lastName rank email')
        .populate('participants.userId', 'firstName lastName rank email')
        .populate('equipmentUsed.assetId', 'name serialNumber type status')
        .populate('curriculum.assessments.evaluator', 'firstName lastName rank');

      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      res.json(training);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch training session');
    }
  }

  // Create new training session
  async createTraining(req, res) {
    try {
      const trainingData = {
        ...req.body,
        baseId: req.user.baseId,
        createdBy: req.user._id
      };

      const training = new Training(trainingData);
      await training.save();

      // Populate for response
      await training.populate([
        { path: 'instructor', select: 'firstName lastName rank' },
        { path: 'participants.userId', select: 'firstName lastName rank' },
        { path: 'equipmentUsed.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, training, 'Training session created successfully', 201);

    } catch (error) {
      this.handleError(res, error, 'Failed to create training session');
    }
  }

  // Update training session
  async updateTraining(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const training = await Training.findById(id);
      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update training
      Object.assign(training, updates);
      training.updatedAt = new Date();
      await training.save();

      // Populate for response
      await training.populate([
        { path: 'instructor', select: 'firstName lastName rank' },
        { path: 'participants.userId', select: 'firstName lastName rank' },
        { path: 'equipmentUsed.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, training, 'Training session updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to update training session');
    }
  }

  // Delete training session
  async deleteTraining(req, res) {
    try {
      const { id } = req.params;

      const training = await Training.findById(id);
      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Only allow deletion if training is in planning status
      if (!['planning', 'cancelled'].includes(training.status)) {
        return res.status(400).json({
          message: 'Cannot delete training that is in progress or completed'
        });
      }

      await Training.findByIdAndDelete(id);
      this.sendSuccess(res, null, 'Training session deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to delete training session');
    }
  }

  // Get training statistics
  async getTrainingStats(req, res) {
    try {
      let query = {};
      this.applyBaseFilter(query, req.user);

      const [
        totalSessions,
        statusStats,
        typeStats,
        upcomingSessions,
        completionRates
      ] = await Promise.all([
        Training.countDocuments(query),
        Training.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Training.aggregate([
          { $match: query },
          { $group: { _id: '$trainingType', count: { $sum: 1 } } }
        ]),
        Training.countDocuments({ 
          ...query, 
          status: 'scheduled',
          startDate: { $gte: new Date() }
        }),
        Training.aggregate([
          { $match: { ...query, status: 'completed' } },
          { $unwind: '$participants' },
          { $group: {
            _id: null,
            totalParticipants: { $sum: 1 },
            passedParticipants: { 
              $sum: { $cond: [{ $eq: ['$participants.passed', true] }, 1, 0] }
            }
          }}
        ])
      ]);

      const completionRate = completionRates.length > 0 
        ? (completionRates[0].passedParticipants / completionRates[0].totalParticipants * 100).toFixed(1)
        : 0;

      res.json({
        totalSessions,
        upcomingSessions,
        statusStats,
        typeStats,
        completionRate: parseFloat(completionRate)
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch training statistics');
    }
  }

  // Add participants to training
  async addParticipants(req, res) {
    try {
      const { id } = req.params;
      const { participants } = req.body;

      const training = await Training.findById(id);
      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Add participants
      training.participants.push(...participants);
      await training.save();

      this.sendSuccess(res, training, 'Participants added to training');

    } catch (error) {
      this.handleError(res, error, 'Failed to add participants to training');
    }
  }

  // Update participant status
  async updateParticipantStatus(req, res) {
    try {
      const { id, participantId } = req.params;
      const { status, score, passed, notes } = req.body;

      const training = await Training.findById(id);
      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Find and update participant
      const participant = training.participants.id(participantId);
      if (!participant) {
        return this.handleNotFound(res, 'Participant');
      }

      participant.status = status;
      if (score !== undefined) participant.score = score;
      if (passed !== undefined) participant.passed = passed;
      if (notes) participant.notes = notes;

      await training.save();
      this.sendSuccess(res, training, 'Participant status updated');

    } catch (error) {
      this.handleError(res, error, 'Failed to update participant status');
    }
  }

  // Update training status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const training = await Training.findById(id);
      if (!training) {
        return this.handleNotFound(res, 'Training session');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && training.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update status
      training.status = status;
      training.statusHistory.push({
        status,
        timestamp: new Date(),
        notes,
        updatedBy: req.user._id
      });

      await training.save();
      this.sendSuccess(res, training, 'Training status updated');

    } catch (error) {
      this.handleError(res, error, 'Failed to update training status');
    }
  }

  // Get upcoming training sessions
  async getUpcomingTraining(req, res) {
    try {
      let query = {
        status: 'scheduled',
        startDate: { $gte: new Date() }
      };
      
      this.applyBaseFilter(query, req.user);

      const upcomingTraining = await Training.find(query)
        .populate('instructor', 'firstName lastName rank')
        .populate('participants.userId', 'firstName lastName rank')
        .sort({ startDate: 1 })
        .limit(10);

      res.json(upcomingTraining);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch upcoming training');
    }
  }
}

module.exports = new TrainingController();
