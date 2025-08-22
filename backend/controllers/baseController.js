const Base = require('../models/Base');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Get all bases
const getBases = async (req, res) => {
  try {
    const { isActive = true, page = 1, limit = 50 } = req.query;
    const user = req.user;
    
    let filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Base commanders and logistics officers can only see their assigned base
    if (user.role !== 'admin' && user.baseId) {
      filter._id = user.baseId._id;
    }

    const skip = (page - 1) * limit;

    const bases = await Base.find(filter)
      .populate('commanderId', 'firstName lastName rank')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Base.countDocuments(filter);

    res.json({
      bases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Get bases error:', error);
    res.status(500).json({ message: 'Error fetching bases' });
  }
};

// Get base by ID
const getBaseById = async (req, res) => {
  try {
    const user = req.user;
    const baseId = req.params.id;

    // Check access permissions
    if (user.role !== 'admin' && user.baseId._id.toString() !== baseId) {
      return res.status(403).json({ message: 'Access denied to this base' });
    }

    const base = await Base.findById(baseId)
      .populate('commanderId', 'firstName lastName rank email');
    
    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    res.json(base);

  } catch (error) {
    logger.error('Get base by ID error:', error);
    res.status(500).json({ message: 'Error fetching base' });
  }
};

// Create new base
const createBase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const base = new Base(req.body);
    await base.save();

    res.status(201).json({
      message: 'Base created successfully',
      base
    });

  } catch (error) {
    logger.error('Create base error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Base with this name or code already exists' });
    }
    res.status(500).json({ message: 'Error creating base' });
  }
};

// Update base
const updateBase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const base = await Base.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('commanderId', 'firstName lastName rank');

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    res.json({
      message: 'Base updated successfully',
      base
    });

  } catch (error) {
    logger.error('Update base error:', error);
    res.status(500).json({ message: 'Error updating base' });
  }
};

// Delete base (soft delete)
const deleteBase = async (req, res) => {
  try {
    const base = await Base.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!base) {
      return res.status(404).json({ message: 'Base not found' });
    }

    res.json({ message: 'Base deactivated successfully' });

  } catch (error) {
    logger.error('Delete base error:', error);
    res.status(500).json({ message: 'Error deactivating base' });
  }
};

module.exports = {
  getBases,
  getBaseById,
  createBase,
  updateBase,
  deleteBase
};
