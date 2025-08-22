const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['purchase', 'transfer_out', 'transfer_in', 'assignment', 'expenditure', 'return'],
    required: true
  },
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
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  totalValue: {
    type: Number,
    min: 0
  },
  // For transfers
  fromBaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base'
  },
  toBaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base'
  },
  // For assignments
  assignedTo: {
    personnelId: String,
    personnelName: String,
    rank: String,
    unit: String
  },
  // For purchases
  vendor: {
    name: String,
    contactInfo: String
  },
  purchaseOrderNumber: String,
  invoiceNumber: String,
  // General fields
  description: String,
  remarks: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ baseId: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ assetId: 1, transactionDate: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
