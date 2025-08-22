const Asset = require('../models/Asset');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Get all assets
const getAssets = async (req, res) => {
  try {
    const { category, isActive = true, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const assets = await Asset.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Asset.countDocuments(filter);

    res.json({
      assets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Get assets error:', error);
    res.status(500).json({ message: 'Error fetching assets' });
  }
};

// Get asset by ID
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(asset);

  } catch (error) {
    logger.error('Get asset by ID error:', error);
    res.status(500).json({ message: 'Error fetching asset' });
  }
};

// Create new asset
const createAsset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const asset = new Asset(req.body);
    await asset.save();

    res.status(201).json({
      message: 'Asset created successfully',
      asset
    });

  } catch (error) {
    logger.error('Create asset error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Asset with this serial number already exists' });
    }
    res.status(500).json({ message: 'Error creating asset' });
  }
};

// Update asset
const updateAsset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({
      message: 'Asset updated successfully',
      asset
    });

  } catch (error) {
    logger.error('Update asset error:', error);
    res.status(500).json({ message: 'Error updating asset' });
  }
};

// Delete asset (soft delete)
const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ message: 'Asset deactivated successfully' });

  } catch (error) {
    logger.error('Delete asset error:', error);
    res.status(500).json({ message: 'Error deactivating asset' });
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
};
