const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  openingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  expendedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique asset-base combination
inventorySchema.index({ assetId: 1, baseId: 1 }, { unique: true });

// Calculate net movement
inventorySchema.virtual('netMovement').get(function() {
  return this.currentBalance - this.openingBalance;
});

module.exports = mongoose.model('Inventory', inventorySchema);
