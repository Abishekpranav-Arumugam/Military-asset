const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const Asset = require('../models/Asset');
const Base = require('../models/Base');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Create purchase transaction
const createPurchase = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Purchase validation errors:', errors.array());
      logger.error('Request body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      assetId,
      baseId,
      quantity,
      unitPrice,
      vendorName,
      vendorContact,
      purchaseOrderNumber,
      invoiceNumber,
      description,
      remarks
    } = req.body;

    // Verify base access
    if (req.user.role !== 'admin' && req.user.baseId._id.toString() !== baseId) {
      return res.status(403).json({ message: 'Access denied to this base' });
    }

    const totalValue = quantity * unitPrice;

    const transaction = new Transaction({
      type: 'purchase',
      assetId,
      baseId,
      quantity,
      unitPrice,
      totalValue,
      vendor: {
        name: vendorName,
        contact: vendorContact
      },
      purchaseOrderNumber,
      invoiceNumber,
      description,
      remarks,
      createdBy: req.user._id,
      status: 'completed'
    });

    await transaction.save();

    // Update inventory
    await updateInventoryBalance(assetId, baseId, quantity, 'add');

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('assetId', 'name category')
      .populate('baseId', 'name code')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Purchase recorded successfully',
      transaction: populatedTransaction
    });

  } catch (error) {
    logger.error('Create purchase error:', error);
    res.status(500).json({ message: 'Error creating purchase transaction' });
  }
};

// Create transfer transaction
const createTransfer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Transfer validation errors:', errors.array());
      logger.error('Request body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      assetId,
      fromBaseId,
      toBaseId,
      quantity,
      description,
      remarks
    } = req.body;

    // Verify access to source base
    if (req.user.role !== 'admin' && req.user.baseId._id.toString() !== fromBaseId) {
      return res.status(403).json({ message: 'Access denied to source base' });
    }

    // Check inventory availability
    const inventory = await Inventory.findOne({ assetId, baseId: fromBaseId });
    if (!inventory || inventory.currentBalance < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory for transfer' });
    }

    // Create transfer out transaction
    const transferOut = new Transaction({
      type: 'transfer_out',
      assetId,
      baseId: fromBaseId,
      fromBaseId,
      toBaseId,
      quantity,
      description,
      remarks,
      createdBy: req.user._id,
      status: 'completed'
    });

    // Create transfer in transaction
    const transferIn = new Transaction({
      type: 'transfer_in',
      assetId,
      baseId: toBaseId,
      fromBaseId,
      toBaseId,
      quantity,
      description,
      remarks,
      createdBy: req.user._id,
      status: 'completed'
    });

    await Promise.all([transferOut.save(), transferIn.save()]);

    // Update inventories
    await Promise.all([
      updateInventoryBalance(assetId, fromBaseId, quantity, 'subtract'),
      updateInventoryBalance(assetId, toBaseId, quantity, 'add')
    ]);

    const populatedTransferOut = await Transaction.findById(transferOut._id)
      .populate('assetId', 'name category')
      .populate('fromBaseId', 'name code')
      .populate('toBaseId', 'name code');

    res.status(201).json({
      message: 'Transfer completed successfully',
      transferOut: populatedTransferOut,
      transferIn: transferIn._id
    });

  } catch (error) {
    logger.error('Create transfer error:', error);
    res.status(500).json({ message: 'Error creating transfer transaction' });
  }
};

// Create assignment transaction
const createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Assignment validation errors:', errors.array());
      logger.error('Request body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      assetId,
      baseId,
      quantity,
      assignedTo,
      description,
      remarks
    } = req.body;

    // Verify base access
    if (req.user.role !== 'admin' && req.user.baseId._id.toString() !== baseId) {
      return res.status(403).json({ message: 'Access denied to this base' });
    }

    // Check inventory availability
    const inventory = await Inventory.findOne({ assetId, baseId });
    if (!inventory || (inventory.currentBalance - inventory.assignedQuantity) < quantity) {
      return res.status(400).json({ message: 'Insufficient available inventory for assignment' });
    }

    const transaction = new Transaction({
      type: 'assignment',
      assetId,
      baseId,
      quantity,
      assignedTo,
      description,
      remarks,
      createdBy: req.user._id,
      status: 'completed'
    });

    await transaction.save();

    // Update assigned quantity in inventory
    await Inventory.findOneAndUpdate(
      { assetId, baseId },
      { $inc: { assignedQuantity: quantity } }
    );

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('assetId', 'name category')
      .populate('baseId', 'name code')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Assignment recorded successfully',
      transaction: populatedTransaction
    });

  } catch (error) {
    logger.error('Create assignment error:', error);
    res.status(500).json({ message: 'Error creating assignment transaction' });
  }
};

// Create expenditure transaction
const createExpenditure = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      assetId,
      baseId,
      quantity,
      description,
      remarks
    } = req.body;

    // Verify base access
    if (req.user.role !== 'admin' && req.user.baseId._id.toString() !== baseId) {
      return res.status(403).json({ message: 'Access denied to this base' });
    }

    const transaction = new Transaction({
      type: 'expenditure',
      assetId,
      baseId,
      quantity,
      description,
      remarks,
      createdBy: req.user._id,
      status: 'completed'
    });

    await transaction.save();

    // Update expended quantity in inventory
    await Inventory.findOneAndUpdate(
      { assetId, baseId },
      { $inc: { expendedQuantity: quantity } }
    );

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('assetId', 'name category')
      .populate('baseId', 'name code')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Expenditure recorded successfully',
      transaction: populatedTransaction
    });

  } catch (error) {
    logger.error('Create expenditure error:', error);
    res.status(500).json({ message: 'Error creating expenditure transaction' });
  }
};

// Get transactions with filters
const getTransactions = async (req, res) => {
  try {
    const { 
      baseId, 
      type, 
      startDate, 
      endDate, 
      assetCategory,
      page = 1, 
      limit = 20 
    } = req.query;

    const user = req.user;

    // Build base filter
    let baseFilter = {};
    if (user.role === 'base_commander' || user.role === 'logistics_officer') {
      baseFilter = { baseId: user.baseId._id };
    } else if (baseId) {
      baseFilter = { baseId };
    }

    // Build other filters
    let filters = { ...baseFilter };
    if (type) filters.type = type;
    if (startDate || endDate) {
      filters.transactionDate = {};
      if (startDate) filters.transactionDate.$gte = new Date(startDate);
      if (endDate) filters.transactionDate.$lte = new Date(endDate);
    }

    // Asset category filter
    if (assetCategory) {
      const assets = await Asset.find({ category: assetCategory });
      filters.assetId = { $in: assets.map(a => a._id) };
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filters)
      .populate('assetId', 'name category subcategory')
      .populate('baseId', 'name code')
      .populate('fromBaseId', 'name code')
      .populate('toBaseId', 'name code')
      .populate('createdBy', 'firstName lastName rank')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filters);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Helper function to update inventory balance
const updateInventoryBalance = async (assetId, baseId, quantity, operation) => {
  const updateValue = operation === 'add' ? quantity : -quantity;
  
  await Inventory.findOneAndUpdate(
    { assetId, baseId },
    { 
      $inc: { currentBalance: updateValue },
      $set: { lastUpdated: new Date() }
    },
    { upsert: true }
  );
};

module.exports = {
  createPurchase,
  createTransfer,
  createAssignment,
  createExpenditure,
  getTransactions
};
