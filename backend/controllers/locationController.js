const Location = require('../models/Location');
const Asset = require('../models/Asset');
const User = require('../models/User');
const BaseController = require('./BaseControllerClass');

class LocationController extends BaseController {
  // Get all locations with filtering
  async getLocations(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        locationType,
        status,
        search
      } = req.query;

      // Build query
      let query = {};
      
      // Apply base filter
      this.applyBaseFilter(query, req.user);

      // Location type filter
      if (locationType) {
        query.locationType = locationType;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { building: { $regex: search, $options: 'i' } },
          { room: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const { skip } = this.parsePagination({ page, limit });

      // Execute query
      const [locations, total] = await Promise.all([
        Location.find(query)
          .populate('manager', 'firstName lastName rank')
          .populate('assets.assetId', 'name serialNumber type')
          .sort({ name: 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Location.countDocuments(query)
      ]);

      res.json({
        locations,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch locations');
    }
  }

  // Get location by ID
  async getLocationById(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findById(id)
        .populate('manager', 'firstName lastName rank email')
        .populate('assets.assetId', 'name serialNumber type status')
        .populate('inspections.inspector', 'firstName lastName rank')
        .populate('accessLogs.userId', 'firstName lastName rank');

      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      res.json(location);

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch location');
    }
  }

  // Create new location
  async createLocation(req, res) {
    try {
      const locationData = {
        ...req.body,
        baseId: req.user.baseId,
        createdBy: req.user._id
      };

      const location = new Location(locationData);
      await location.save();

      // Populate for response
      await location.populate([
        { path: 'manager', select: 'firstName lastName rank' },
        { path: 'assets.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, location, 'Location created successfully', 201);

    } catch (error) {
      this.handleError(res, error, 'Failed to create location');
    }
  }

  // Update location
  async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Update location
      Object.assign(location, updates);
      location.updatedAt = new Date();
      await location.save();

      // Populate for response
      await location.populate([
        { path: 'manager', select: 'firstName lastName rank' },
        { path: 'assets.assetId', select: 'name serialNumber type' }
      ]);

      this.sendSuccess(res, location, 'Location updated successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to update location');
    }
  }

  // Delete location
  async deleteLocation(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Check if location has assets
      if (location.assets && location.assets.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete location that contains assets'
        });
      }

      await Location.findByIdAndDelete(id);
      this.sendSuccess(res, null, 'Location deleted successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to delete location');
    }
  }

  // Get location statistics
  async getLocationStats(req, res) {
    try {
      let query = {};
      this.applyBaseFilter(query, req.user);

      const [
        totalLocations,
        typeStats,
        statusStats,
        capacityStats
      ] = await Promise.all([
        Location.countDocuments(query),
        Location.aggregate([
          { $match: query },
          { $group: { _id: '$locationType', count: { $sum: 1 } } }
        ]),
        Location.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Location.aggregate([
          { $match: query },
          { $group: {
            _id: null,
            totalCapacity: { $sum: '$capacity.maxAssets' },
            usedCapacity: { $sum: { $size: '$assets' } }
          }}
        ])
      ]);

      const utilizationRate = capacityStats.length > 0 
        ? (capacityStats[0].usedCapacity / capacityStats[0].totalCapacity * 100).toFixed(1)
        : 0;

      res.json({
        totalLocations,
        typeStats,
        statusStats,
        utilizationRate: parseFloat(utilizationRate)
      });

    } catch (error) {
      this.handleError(res, error, 'Failed to fetch location statistics');
    }
  }

  // Add asset to location
  async addAsset(req, res) {
    try {
      const { id } = req.params;
      const { assetId, position } = req.body;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Check capacity
      if (location.assets.length >= location.capacity.maxAssets) {
        return res.status(400).json({
          message: 'Location has reached maximum capacity'
        });
      }

      // Add asset
      location.assets.push({
        assetId,
        position,
        assignedAt: new Date(),
        assignedBy: req.user._id
      });

      await location.save();
      this.sendSuccess(res, location, 'Asset added to location');

    } catch (error) {
      this.handleError(res, error, 'Failed to add asset to location');
    }
  }

  // Remove asset from location
  async removeAsset(req, res) {
    try {
      const { id, assetId } = req.params;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Remove asset
      location.assets = location.assets.filter(
        asset => asset.assetId.toString() !== assetId
      );

      await location.save();
      this.sendSuccess(res, location, 'Asset removed from location');

    } catch (error) {
      this.handleError(res, error, 'Failed to remove asset from location');
    }
  }

  // Add inspection record
  async addInspection(req, res) {
    try {
      const { id } = req.params;
      const inspectionData = req.body;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Add inspection
      location.inspections.push({
        ...inspectionData,
        inspector: req.user._id,
        inspectionDate: new Date()
      });

      await location.save();
      this.sendSuccess(res, location, 'Inspection record added');

    } catch (error) {
      this.handleError(res, error, 'Failed to add inspection record');
    }
  }

  // Log access to location
  async logAccess(req, res) {
    try {
      const { id } = req.params;
      const { accessType, purpose } = req.body;

      const location = await Location.findById(id);
      if (!location) {
        return this.handleNotFound(res, 'Location');
      }

      // Check access permissions
      if (req.user.role !== 'admin' && location.baseId.toString() !== req.user.baseId.toString()) {
        return this.handleUnauthorized(res);
      }

      // Log access
      location.accessLogs.push({
        userId: req.user._id,
        accessType,
        purpose,
        timestamp: new Date()
      });

      // Keep only last 100 access logs
      if (location.accessLogs.length > 100) {
        location.accessLogs = location.accessLogs.slice(-100);
      }

      await location.save();
      this.sendSuccess(res, location, 'Access logged successfully');

    } catch (error) {
      this.handleError(res, error, 'Failed to log access');
    }
  }

  // Get location capacity report
  async getCapacityReport(req, res) {
    try {
      let query = {};
      this.applyBaseFilter(query, req.user);

      const locations = await Location.find(query)
        .select('name locationType capacity assets')
        .populate('assets.assetId', 'name type');

      const capacityReport = locations.map(location => ({
        _id: location._id,
        name: location.name,
        locationType: location.locationType,
        maxCapacity: location.capacity.maxAssets,
        currentOccupancy: location.assets.length,
        utilizationRate: ((location.assets.length / location.capacity.maxAssets) * 100).toFixed(1),
        availableSpace: location.capacity.maxAssets - location.assets.length
      }));

      res.json(capacityReport);

    } catch (error) {
      this.handleError(res, error, 'Failed to generate capacity report');
    }
  }
}

module.exports = new LocationController();
