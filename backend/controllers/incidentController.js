const Incident = require('../models/Incident');
const Asset = require('../models/Asset');
const User = require('../models/User');
const BaseController = require('./BaseControllerClass');

class IncidentController extends BaseController {
  // Get all incidents with filtering
  async getIncidents(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        severity,
        incidentType,
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

      // Severity filter
      if (severity) {
        query.severity = severity;
      }

      // Incident type filter
      if (incidentType) {
        query.incidentType = incidentType;
      }

      // Date range filter
      const dateRange = this.buildDateRangeQuery(startDate, endDate);
      if (dateRange) {
        query.incidentDate = dateRange;
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
      const [incidents, total] = await Promise.all([
        Incident.find(query)
          .populate('reportedBy', 'firstName lastName rank')
          .populate('assignedTo', 'firstName lastName rank')
          .populate('involvedAssets.assetId', 'name serialNumber type')
          .populate('involvedPersonnel.userId', 'firstName lastName rank')
          .sort({ incidentDate: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Incident.countDocuments(query)
      ]);

      res.json({
        incidents,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch incidents');
    }
  }

  // Get incident by ID
  async getIncidentById(req, res) {
    try {
      const { id } = req.params;

      const incident = await Incident.findById(id)
        .populate('reportedBy', 'firstName lastName rank email')
        .populate('assignedTo', 'firstName lastName rank email')
        .populate('involvedAssets.assetId', 'name serialNumber type status')
        .populate('involvedPersonnel.userId', 'firstName lastName rank email')
        .populate('investigation.investigator', 'firstName lastName rank')
        .populate('correctiveActions.assignedTo', 'firstName lastName rank')
        .populate('preventiveActions.assignedTo', 'firstName lastName rank');

      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      res.json(incident);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch incident');
    }
  }

  // Create new incident
  async createIncident(req, res) {
    try {
      const incidentData = {
        ...req.body,
        baseId: req.user.baseId,
        reportedBy: req.user._id,
        incidentNumber: await this.generateIncidentNumber()
      };

      const incident = new Incident(incidentData);
      await incident.save();

      // Populate for response
      await incident.populate([
        { path: 'reportedBy', select: 'firstName lastName rank' },
        { path: 'assignedTo', select: 'firstName lastName rank' },
        { path: 'involvedAssets.assetId', select: 'name serialNumber type' },
        { path: 'involvedPersonnel.userId', select: 'firstName lastName rank' }
      ]);

      this.sendSuccess(res, incident, 'Incident reported successfully', 201);

    } catch (error) {
      this.handleError(res, error, 'Failed to create incident');
    }
  }

  // Update incident
  async updateIncident(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const incident = await Incident.findById(id);
      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update incident
      Object.assign(incident, updates);
      incident.updatedAt = new Date();
      await incident.save();

      // Populate for response
      await incident.populate([
        { path: 'reportedBy', select: 'firstName lastName rank' },
        { path: 'assignedTo', select: 'firstName lastName rank' },
        { path: 'involvedAssets.assetId', select: 'name serialNumber type' },
        { path: 'involvedPersonnel.userId', select: 'firstName lastName rank' }
      ]);

      this.sendSuccess(res, incident, 'Incident updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to update incident');
    }
  }

  // Delete incident
  async deleteIncident(req, res) {
    try {
      const { id } = req.params;

      const incident = await Incident.findById(id);
      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Only allow deletion if incident is in draft status
      if (incident.status !== 'draft') {
        return res.status(400).json({
          message: 'Cannot delete incident that has been submitted'
        });
      }

      await Incident.findByIdAndDelete(id);
      this.sendSuccess(res, null, 'Incident deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to delete incident');
    }
  }

  // Get incident statistics
  async getIncidentStats(req, res) {
    try {
      let query = {};
      this.applyBaseFilter(query, req.user);

      const [
        totalIncidents,
        statusStats,
        severityStats,
        typeStats,
        openIncidents
      ] = await Promise.all([
        Incident.countDocuments(query),
        Incident.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Incident.aggregate([
          { $match: query },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Incident.aggregate([
          { $match: query },
          { $group: { _id: '$incidentType', count: { $sum: 1 } } }
        ]),
        Incident.countDocuments({ ...query, status: { $in: ['open', 'investigating'] } })
      ]);

      res.json({
        totalIncidents,
        openIncidents,
        statusStats,
        severityStats,
        typeStats
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch incident statistics');
    }
  }

  // Update incident status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const incident = await Incident.findById(id);
      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update status
      incident.status = status;
      incident.statusHistory.push({
        status,
        timestamp: new Date(),
        notes,
        updatedBy: req.user._id
      });

      await incident.save();
      this.sendSuccess(res, incident, 'Incident status updated');

    } catch (error) {
      this.handleError(res, error, 'Failed to update incident status');
    }
  }

  // Add investigation details
  async addInvestigation(req, res) {
    try {
      const { id } = req.params;
      const investigationData = req.body;

      const incident = await Incident.findById(id);
      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update investigation
      incident.investigation = {
        ...incident.investigation,
        ...investigationData,
        investigator: req.user._id,
        updatedAt: new Date()
      };

      await incident.save();
      this.sendSuccess(res, incident, 'Investigation details added');

    } catch (error) {
      this.handleError(res, error, 'Failed to add investigation details');
    }
  }

  // Add corrective action
  async addCorrectiveAction(req, res) {
    try {
      const { id } = req.params;
      const actionData = req.body;

      const incident = await Incident.findById(id);
      if (!incident) {
        return this.handleNotFound(res, 'Incident');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && incident.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Add corrective action
      incident.correctiveActions.push({
        ...actionData,
        createdBy: req.user._id
      });

      await incident.save();
      this.sendSuccess(res, incident, 'Corrective action added');

    } catch (error) {
      this.handleError(res, error, 'Failed to add corrective action');
    }
  }

  // Generate unique incident number
  async generateIncidentNumber() {
    const year = new Date().getFullYear();
    const count = await Incident.countDocuments({
      incidentNumber: { $regex: `^INC-${year}-` }
    });
    return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

module.exports = new IncidentController();
