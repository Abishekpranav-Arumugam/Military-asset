const AuditLog = require('../models/AuditLog');
const BaseController = require('./BaseControllerClass');

class AuditController extends BaseController {
  // Get audit logs with filtering and pagination
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        action,
        entityType,
        userId,
        startDate,
        endDate
      } = req.query;

      // Build query
      let query = {};

      // Apply base filter if user is not admin
      if (req.user.role !== 'admin') {
        query.baseId = req.user.baseId;
      }

      // Search filter
      if (search) {
        query.$or = [
          { details: { $regex: search, $options: 'i' } },
          { entityType: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } }
        ];
      }

      // Action filter
      if (action) {
        query.action = action;
      }

      // Entity type filter
      if (entityType) {
        query.entityType = entityType;
      }

      // User filter
      if (userId) {
        query.userId = userId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query with population
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate('userId', 'firstName lastName rank role')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        AuditLog.countDocuments(query)
      ]);

      // Transform data for response
      const transformedLogs = logs.map(log => ({
        _id: log._id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        changes: log.changes,
        timestamp: log.timestamp,
        user: log.userId ? {
          firstName: log.userId.firstName,
          lastName: log.userId.lastName,
          rank: log.userId.rank,
          role: log.userId.role
        } : null
      }));

      res.json({
        logs: transformedLogs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch audit logs');
    }
  }

  // Get audit log statistics
  async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Build base query
      let query = {};
      if (req.user.role !== 'admin') {
        query.baseId = req.user.baseId;
      }

      // Date range filter
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Get statistics
      const [
        totalLogs,
        actionStats,
        entityStats,
        recentActivity
      ] = await Promise.all([
        AuditLog.countDocuments(query),
        AuditLog.aggregate([
          { $match: query },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AuditLog.aggregate([
          { $match: query },
          { $group: { _id: '$entityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AuditLog.find(query)
          .populate('userId', 'firstName lastName rank')
          .sort({ timestamp: -1 })
          .limit(10)
      ]);

      res.json({
        totalLogs,
        actionStats,
        entityStats,
        recentActivity: recentActivity.map(log => ({
          action: log.action,
          entityType: log.entityType,
          details: log.details,
          timestamp: log.timestamp,
          user: log.userId ? `${log.userId.rank} ${log.userId.firstName} ${log.userId.lastName}` : 'System'
        }))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch audit statistics');
    }
  }

  // Export audit logs (for admin users)
  async exportAuditLogs(req, res) {
    try {
      // Check if user has admin privileges
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }

      const { format = 'csv', startDate, endDate } = req.query;

      // Build query
      let query = {};
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Get all logs
      const logs = await AuditLog.find(query)
        .populate('userId', 'firstName lastName rank role')
        .sort({ timestamp: -1 });

      if (format === 'csv') {
        // Generate CSV
        const csv = this.generateCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(csv);
      } else {
        // Return JSON
        res.json({
          logs: logs.map(log => ({
            timestamp: log.timestamp,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            details: log.details,
            changes: log.changes,
            user: log.userId ? `${log.userId.rank} ${log.userId.firstName} ${log.userId.lastName}` : 'System'
          }))
        });
      }

    } catch (error) {
      this.handleError(res, error, 'Failed to export audit logs');
    }
  }

  // Helper method to generate CSV
  generateCSV(logs) {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Details', 'User', 'Changes'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.action,
      log.entityType,
      log.entityId || '',
      log.details,
      log.userId ? `${log.userId.rank} ${log.userId.firstName} ${log.userId.lastName}` : 'System',
      log.changes ? JSON.stringify(log.changes) : ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}

module.exports = new AuditController();
