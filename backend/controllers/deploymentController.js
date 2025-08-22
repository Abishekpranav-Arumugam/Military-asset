const Deployment = require('../models/Deployment');
const Asset = require('../models/Asset');
const User = require('../models/User');
const BaseController = require('./BaseControllerClass');

class DeploymentController extends BaseController {
  // Get all deployments with filtering
  async getDeployments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        missionType,
        priority,
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

      // Mission type filter
      if (missionType) {
        query.missionType = missionType;
      }

      // Priority filter
      if (priority) {
        query.priority = priority;
      }

      // Date range filter
      const dateRange = this.buildDateRangeQuery(startDate, endDate);
      if (dateRange) {
        query.startDate = dateRange;
      }

      // Search filter
      if (search) {
        query.$or = [
          { missionName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const { skip } = this.parsePagination({ page, limit });

      // Execute query
      const [deployments, total] = await Promise.all([
        Deployment.find(query)
          .populate('commanderId', 'firstName lastName rank')
          .populate('assignedPersonnel.userId', 'firstName lastName rank')
          .populate('assignedAssets.assetId', 'name serialNumber type')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Deployment.countDocuments(query)
      ]);

      res.json({
        deployments,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch deployments');
    }
  }

  // Get deployment by ID
  async getDeploymentById(req, res) {
    try {
      const { id } = req.params;

      const deployment = await Deployment.findById(id)
        .populate('commanderId', 'firstName lastName rank email')
        .populate('assignedPersonnel.userId', 'firstName lastName rank email')
        .populate('assignedAssets.assetId', 'name serialNumber type status')
        .populate('approvals.approvedBy', 'firstName lastName rank');

      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      res.json(deployment);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch deployment');
    }
  }

  // Create new deployment
  async createDeployment(req, res) {
    try {
      const deploymentData = {
        ...req.body,
        baseId: req.user.baseId,
        createdBy: req.user._id
      };

      const deployment = new Deployment(deploymentData);
      await deployment.save();

      // Populate for response
      await deployment.populate([
        { path: 'commanderId', select: 'firstName lastName rank' },
        { path: 'assignedPersonnel.userId', select: 'firstName lastName rank' },
        { path: 'assignedAssets.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, deployment, 'Deployment created successfully', 201);

    } catch (error) {
      this.handleError(res, error, 'Failed to create deployment');
    }
  }

  // Update deployment
  async updateDeployment(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const deployment = await Deployment.findById(id);
      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update deployment
      Object.assign(deployment, updates);
      deployment.updatedAt = new Date();
      await deployment.save();

      // Populate for response
      await deployment.populate([
        { path: 'commanderId', select: 'firstName lastName rank' },
        { path: 'assignedPersonnel.userId', select: 'firstName lastName rank' },
        { path: 'assignedAssets.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, deployment, 'Deployment updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to update deployment');
    }
  }

  // Delete deployment
  async deleteDeployment(req, res) {
    try {
      const { id } = req.params;

      const deployment = await Deployment.findById(id);
      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Only allow deletion if deployment is in planning or cancelled status
      if (!['planning', 'cancelled'].includes(deployment.status)) {
        return res.status(400).json({
          message: 'Cannot delete deployment that is active or completed'
        });
      }

      await Deployment.findByIdAndDelete(id);
      this.sendSuccess(res, null, 'Deployment deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to delete deployment');
    }
  }

  // Get deployment statistics
  async getDeploymentStats(req, res) {
    try {
      let query = {};
      this.applyBaseFilter(query, req.user);

      const [
        totalDeployments,
        statusStats,
        priorityStats,
        activeDeployments
      ] = await Promise.all([
        Deployment.countDocuments(query),
        Deployment.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Deployment.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Deployment.countDocuments({ ...query, status: 'active' })
      ]);

      res.json({
        totalDeployments,
        activeDeployments,
        statusStats,
        priorityStats
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch deployment statistics');
    }
  }

  // Add personnel to deployment
  async addPersonnel(req, res) {
    try {
      const { id } = req.params;
      const { personnel } = req.body;

      const deployment = await Deployment.findById(id);
      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Add personnel
      deployment.assignedPersonnel.push(...personnel);
      await deployment.save();

      this.sendSuccess(res, deployment, 'Personnel added to deployment');

    } catch (error) {
      this.handleError(res, error, 'Failed to add personnel to deployment');
    }
  }

  // Add assets to deployment
  async addAssets(req, res) {
    try {
      const { id } = req.params;
      const { assets } = req.body;

      const deployment = await Deployment.findById(id);
      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Add assets
      deployment.assignedAssets.push(...assets);
      await deployment.save();

      this.sendSuccess(res, deployment, 'Assets added to deployment');

    } catch (error) {
      this.handleError(res, error, 'Failed to add assets to deployment');
    }
  }

  // Update deployment status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const deployment = await Deployment.findById(id);
      if (!deployment) {
        return this.handleNotFound(res, 'Deployment');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && deployment.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update status
      deployment.status = status;
      if (notes) {
        deployment.statusHistory.push({
          status,
          timestamp: new Date(),
          notes,
          updatedBy: req.user._id
        });
      }

      await deployment.save();
      this.sendSuccess(res, deployment, 'Deployment status updated');

    } catch (error) {
      this.handleError(res, error, 'Failed to update deployment status');
    }
  }
}

module.exports = new DeploymentController();
