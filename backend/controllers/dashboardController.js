const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const Base = require('../models/Base');
const logger = require('../config/logger');

// Get dashboard metrics
const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetCategory } = req.query;
    const user = req.user;

    // Build base filter based on user role
    let baseFilter = {};
    if (user.role === 'base_commander' || user.role === 'logistics_officer') {
      baseFilter = { baseId: user.baseId._id };
    } else if (baseId) {
      baseFilter = { baseId };
    }

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.transactionDate = {};
      if (startDate) dateFilter.transactionDate.$gte = new Date(startDate);
      if (endDate) dateFilter.transactionDate.$lte = new Date(endDate);
    }

    // Build asset filter
    let assetFilter = {};
    if (assetCategory) {
      const assets = await Asset.find({ category: assetCategory });
      assetFilter.assetId = { $in: assets.map(a => a._id) };
    }

    const combinedFilter = { ...baseFilter, ...dateFilter, ...assetFilter };

    // Get inventory data
    const inventoryData = await Inventory.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'assets',
          localField: 'assetId',
          foreignField: '_id',
          as: 'asset'
        }
      },
      { $unwind: '$asset' },
      ...(assetCategory ? [{ $match: { 'asset.category': assetCategory } }] : []),
      {
        $group: {
          _id: null,
          totalOpeningBalance: { $sum: '$openingBalance' },
          totalCurrentBalance: { $sum: '$currentBalance' },
          totalAssigned: { $sum: '$assignedQuantity' },
          totalExpended: { $sum: '$expendedQuantity' }
        }
      }
    ]);

    // Get transaction summaries
    const transactionSummary = await Transaction.aggregate([
      { $match: { ...combinedFilter, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate net movements
    const purchases = transactionSummary.find(t => t._id === 'purchase') || { totalQuantity: 0, totalValue: 0 };
    const transfersIn = transactionSummary.find(t => t._id === 'transfer_in') || { totalQuantity: 0, totalValue: 0 };
    const transfersOut = transactionSummary.find(t => t._id === 'transfer_out') || { totalQuantity: 0, totalValue: 0 };

    const netMovement = purchases.totalQuantity + transfersIn.totalQuantity - transfersOut.totalQuantity;

    // Get recent transactions
    const recentTransactions = await Transaction.find(combinedFilter)
      .populate('assetId', 'name category')
      .populate('baseId', 'name code')
      .populate('createdBy', 'firstName lastName rank')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get asset category breakdown
    const categoryBreakdown = await Inventory.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: 'assets',
          localField: 'assetId',
          foreignField: '_id',
          as: 'asset'
        }
      },
      { $unwind: '$asset' },
      {
        $group: {
          _id: '$asset.category',
          currentBalance: { $sum: '$currentBalance' },
          assignedQuantity: { $sum: '$assignedQuantity' },
          expendedQuantity: { $sum: '$expendedQuantity' }
        }
      }
    ]);

    const metrics = {
      openingBalance: inventoryData[0]?.totalOpeningBalance || 0,
      closingBalance: inventoryData[0]?.totalCurrentBalance || 0,
      netMovement,
      assigned: inventoryData[0]?.totalAssigned || 0,
      expended: inventoryData[0]?.totalExpended || 0,
      purchases: purchases.totalQuantity,
      transfersIn: transfersIn.totalQuantity,
      transfersOut: transfersOut.totalQuantity,
      transactionSummary,
      recentTransactions,
      categoryBreakdown
    };

    res.json(metrics);

  } catch (error) {
    logger.error('Dashboard metrics error:', error);
    res.status(500).json({ message: 'Error fetching dashboard metrics' });
  }
};

// Get detailed movement breakdown
const getMovementDetails = async (req, res) => {
  try {
    const { baseId, startDate, endDate, type } = req.query;
    const user = req.user;

    let baseFilter = {};
    if (user.role === 'base_commander' || user.role === 'logistics_officer') {
      baseFilter = { baseId: user.baseId._id };
    } else if (baseId) {
      baseFilter = { baseId };
    }

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.transactionDate = {};
      if (startDate) dateFilter.transactionDate.$gte = new Date(startDate);
      if (endDate) dateFilter.transactionDate.$lte = new Date(endDate);
    }

    const typeFilter = type ? { type } : {};
    const filter = { ...baseFilter, ...dateFilter, ...typeFilter, status: 'completed' };

    const movements = await Transaction.find(filter)
      .populate('assetId', 'name category subcategory')
      .populate('baseId', 'name code')
      .populate('fromBaseId', 'name code')
      .populate('toBaseId', 'name code')
      .populate('createdBy', 'firstName lastName rank')
      .sort({ transactionDate: -1 });

    res.json(movements);

  } catch (error) {
    logger.error('Movement details error:', error);
    res.status(500).json({ message: 'Error fetching movement details' });
  }
};

module.exports = {
  getDashboardMetrics,
  getMovementDetails
};
