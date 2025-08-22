const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const NotificationService = require('../services/notificationService');
const BaseController = require('./BaseControllerClass');

class MaintenanceController extends BaseController {
  // Get all maintenance records with filtering
  async getMaintenanceRecords(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        maintenanceType,
        assetId,
        priority,
        startDate,
        endDate,
        assignedTo
      } = req.query;

      // Build query
      let query = {};

      // Apply base filter if user is not admin
      this.applyBaseFilter(query, req.user);

      // Apply filters
      if (status) query.status = status;
      if (maintenanceType) query.maintenanceType = maintenanceType;
      if (assetId) query.assetId = assetId;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;

      // Date range filter
      if (startDate || endDate) {
        query.scheduledDate = {};
        if (startDate) query.scheduledDate.$gte = new Date(startDate);
        if (endDate) query.scheduledDate.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const [maintenance, total] = await Promise.all([
        Maintenance.find(query)
          .populate('assetId', 'name serialNumber category status')
          .populate('assignedTo', 'firstName lastName rank')
          .populate('performedBy', 'firstName lastName rank')
          .sort({ scheduledDate: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Maintenance.countDocuments(query)
      ]);

      res.json({
        maintenance,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch maintenance records');
    }
  }

  // Get single maintenance record
  async getMaintenanceById(req, res) {
    try {
      const maintenance = await Maintenance.findById(req.params.id)
        .populate('assetId')
        .populate('assignedTo', 'firstName lastName rank email')
        .populate('performedBy', 'firstName lastName rank')
        .populate('createdBy', 'firstName lastName rank')
        .populate('updatedBy', 'firstName lastName rank');

      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }
      
      this.applyBaseFilter(maintenance, req.user);
      if (!maintenance) {
        return this.handleUnauthorized(res);
      }
      
      res.json(maintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch maintenance record');
    }
  }

  // Create new maintenance record
  async createMaintenance(req, res) {
    try {
      const maintenanceData = {
        ...req.body,
        baseId: req.user.baseId,
        createdBy: req.user.id
      };

      // Validate asset exists and belongs to user's base
      const asset = await Asset.findById(maintenanceData.assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      if (req.user.role !== 'admin' && asset.baseId && asset.baseId.toString() !== req.user.baseId.toString()) {
        return res.status(403).json({ message: 'Access denied to this asset' });
      }

      const maintenance = new Maintenance(maintenanceData);
      await maintenance.save();

      // Populate the response
      await maintenance.populate([
        { path: 'assetId', select: 'name serialNumber category' },
        { path: 'assignedTo', select: 'firstName lastName rank' },
        { path: 'createdBy', select: 'firstName lastName rank' }
      ]);

      // Create notification if assigned to someone
      if (maintenance.assignedTo) {
        await NotificationService.createMaintenanceNotification(maintenance, 'maintenance_due');
      }

      res.status(201).json(maintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to create maintenance record');
    }
  }

  // Update maintenance record
  async updateMaintenance(req, res) {
    try {
      const maintenance = await Maintenance.findById(req.params.id);
      
      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && maintenance.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }
      
      const originalStatus = maintenance.status;
      
      Object.assign(maintenance, req.body);
      maintenance.updatedBy = req.user.id;

      await maintenance.save();

      // Populate the response
      await maintenance.populate([
        { path: 'assetId', select: 'name serialNumber category' },
        { path: 'assignedTo', select: 'firstName lastName rank' },
        { path: 'performedBy', select: 'firstName lastName rank' }
      ]);

      // Handle status change
      if (originalStatus !== maintenance.status && maintenance.status === 'completed' && maintenance.isRecurring) {
        const nextMaintenanceData = maintenance.scheduleNext();
        if (nextMaintenanceData) {
          const nextMaintenance = new Maintenance(nextMaintenanceData);
          await nextMaintenance.save();
        }
      }

      res.json(maintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to update maintenance record');
    }
  }

  // Delete maintenance record
  async deleteMaintenance(req, res) {
    try {
      const maintenance = await Maintenance.findById(req.params.id);
      
      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && maintenance.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      if (!['scheduled', 'cancelled'].includes(maintenance.status)) {
        return res.status(400).json({ 
          message: 'Cannot delete maintenance that is in progress or completed' 
        });
      }

      await Maintenance.findByIdAndDelete(req.params.id);

      res.json({ message: 'Maintenance record deleted successfully' });

    } catch (error) {
      this.handleError(res, error, 'Failed to delete maintenance record');
    }
  }

  // Get overdue maintenance
  async getOverdueMaintenance(req, res) {
    try {
      let query = {};
      if (req.user.role !== 'admin') {
        query.baseId = req.user.baseId;
      }

      const overdueMaintenance = await Maintenance.find({
        ...query,
        status: { $in: ['scheduled', 'overdue'] },
        scheduledDate: { $lt: new Date() }
      })
      .populate('assetId', 'name serialNumber category')
      .populate('assignedTo', 'firstName lastName rank')
      .sort({ scheduledDate: 1 });

      res.json(overdueMaintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch overdue maintenance');
    }
  }

  // Get upcoming maintenance
  async getUpcomingMaintenance(req, res) {
    try {
      const { days = 7 } = req.query;
      let query = {};
      
      if (req.user.role !== 'admin') {
        query.baseId = req.user.baseId;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days));

      const upcomingMaintenance = await Maintenance.find({
        ...query,
        status: 'scheduled',
        scheduledDate: { 
          $gte: new Date(),
          $lte: futureDate 
        }
      })
      .populate('assetId', 'name serialNumber category')
      .populate('assignedTo', 'firstName lastName rank')
      .sort({ scheduledDate: 1 });

      res.json(upcomingMaintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch upcoming maintenance');
    }
  }

  // Get maintenance statistics
  async getMaintenanceStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      let matchQuery = {};

      if (req.user.role !== 'admin') {
        matchQuery.baseId = req.user.baseId;
      }

      if (startDate || endDate) {
        matchQuery.scheduledDate = {};
        if (startDate) matchQuery.scheduledDate.$gte = new Date(startDate);
        if (endDate) matchQuery.scheduledDate.$lte = new Date(endDate);
      }

      const [
        statusStats,
        typeStats,
        priorityStats,
        costStats,
        overdueMaintenance,
        upcomingMaintenance
      ] = await Promise.all([
        Maintenance.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Maintenance.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$maintenanceType', count: { $sum: 1 } } }
        ]),
        Maintenance.aggregate([
          { $match: matchQuery },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Maintenance.aggregate([
          { $match: { ...matchQuery, actualCost: { $exists: true } } },
          { 
            $group: { 
              _id: null, 
              totalCost: { $sum: '$actualCost' },
              avgCost: { $avg: '$actualCost' },
              count: { $sum: 1 }
            } 
          }
        ]),
        Maintenance.findOverdue().countDocuments(),
        Maintenance.findUpcoming(7).countDocuments()
      ]);

      res.json({
        statusStats,
        typeStats,
        priorityStats,
        costStats: costStats[0] || { totalCost: 0, avgCost: 0, count: 0 },
        overdueMaintenance,
        upcomingMaintenance
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch maintenance statistics');
    }
  }

  // Add work log to maintenance
  async addWorkLog(req, res) {
    try {
      const maintenance = await Maintenance.findById(req.params.id);
      
      if (!maintenance) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && maintenance.baseId.toString() !== req.user.baseId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const workLog = {
        ...req.body,
        completedBy: req.user.id,
        completedAt: new Date()
      };

      maintenance.workPerformed.push(workLog);
      
      // Update status to in_progress if it was scheduled
      if (maintenance.status === 'scheduled') {
        maintenance.status = 'in_progress';
      }

      await maintenance.save();

      // Log the activity
      await this.logActivity(req.user.id, 'UPDATE', 'Maintenance', maintenance._id, 
        `Added work log: ${workLog.task}`, req.user.baseId);

      res.json(maintenance);

    } catch (error) {
      this.handleError(res, error, 'Failed to add work log');
    }
  }
}

module.exports = new MaintenanceController();