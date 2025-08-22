const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'maintenance_due',
      'maintenance_overdue',
      'low_inventory',
      'transfer_request',
      'transfer_approved',
      'transfer_rejected',
      'asset_assigned',
      'asset_returned',
      'system_alert',
      'audit_required',
      'compliance_issue',
      'budget_alert',
      'document_expiry',
      'training_due'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String, // URL to navigate to for action
  actionLabel: String, // Label for action button
  relatedEntity: {
    type: {
      type: String,
      enum: ['Asset', 'Transaction', 'Maintenance', 'User', 'Base', 'Inventory', 'Supplier', 'Document']
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String // Cache entity name for quick display
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, isActive: 1 });
notificationSchema.index({ priority: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ baseId: 1, isActive: 1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for expired status
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware to handle read status
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Deactivate if expired
  if (this.isExpired && this.isActive) {
    this.isActive = false;
  }
  
  next();
});

// Static method to create maintenance notification
notificationSchema.statics.createMaintenanceNotification = function(maintenance, type = 'maintenance_due') {
  const titles = {
    maintenance_due: 'Maintenance Due',
    maintenance_overdue: 'Maintenance Overdue'
  };
  
  const messages = {
    maintenance_due: `Maintenance scheduled for ${maintenance.assetId.name} (${maintenance.assetId.serialNumber}) is due on ${maintenance.scheduledDate.toDateString()}`,
    maintenance_overdue: `Maintenance for ${maintenance.assetId.name} (${maintenance.assetId.serialNumber}) is overdue since ${maintenance.scheduledDate.toDateString()}`
  };
  
  return this.create({
    userId: maintenance.assignedTo,
    type,
    title: titles[type],
    message: messages[type],
    priority: type === 'maintenance_overdue' ? 'high' : 'medium',
    actionRequired: true,
    actionUrl: `/maintenance/${maintenance._id}`,
    actionLabel: 'View Maintenance',
    relatedEntity: {
      type: 'Maintenance',
      id: maintenance._id,
      name: maintenance.title
    },
    baseId: maintenance.baseId,
    metadata: {
      assetId: maintenance.assetId._id,
      maintenanceType: maintenance.maintenanceType
    }
  });
};

// Static method to create inventory notification
notificationSchema.statics.createInventoryNotification = function(inventory, threshold) {
  return this.create({
    userId: inventory.responsibleOfficer,
    type: 'low_inventory',
    title: 'Low Inventory Alert',
    message: `${inventory.assetName} inventory is low (${inventory.currentQuantity} remaining, threshold: ${threshold})`,
    priority: inventory.currentQuantity === 0 ? 'critical' : 'high',
    actionRequired: true,
    actionUrl: `/inventory/${inventory._id}`,
    actionLabel: 'Manage Inventory',
    relatedEntity: {
      type: 'Inventory',
      id: inventory._id,
      name: inventory.assetName
    },
    baseId: inventory.baseId,
    metadata: {
      currentQuantity: inventory.currentQuantity,
      threshold: threshold
    }
  });
};

// Static method to create transfer notification
notificationSchema.statics.createTransferNotification = function(transaction, type, recipientId) {
  const titles = {
    transfer_request: 'Transfer Request',
    transfer_approved: 'Transfer Approved',
    transfer_rejected: 'Transfer Rejected'
  };
  
  const messages = {
    transfer_request: `New transfer request for ${transaction.assetName} from ${transaction.fromBase.name}`,
    transfer_approved: `Transfer of ${transaction.assetName} has been approved`,
    transfer_rejected: `Transfer of ${transaction.assetName} has been rejected`
  };
  
  return this.create({
    userId: recipientId,
    type,
    title: titles[type],
    message: messages[type],
    priority: 'medium',
    actionRequired: type === 'transfer_request',
    actionUrl: `/transfers/${transaction._id}`,
    actionLabel: type === 'transfer_request' ? 'Review Request' : 'View Transfer',
    relatedEntity: {
      type: 'Transaction',
      id: transaction._id,
      name: `Transfer: ${transaction.assetName}`
    },
    baseId: transaction.toBase,
    metadata: {
      transactionType: transaction.type,
      quantity: transaction.quantity
    }
  });
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadForUser = function(userId) {
  return this.find({
    userId,
    isRead: false,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ priority: 1, createdAt: -1 });
};

// Static method to find notifications by priority
notificationSchema.statics.findByPriority = function(priority, userId = null) {
  const query = { priority, isActive: true };
  if (userId) query.userId = userId;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      isActive: false
    }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function(userId = null) {
  this.isRead = true;
  this.readAt = new Date();
  if (userId) {
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
  }
  return this.save();
};

// Instance method to mark as acknowledged
notificationSchema.methods.acknowledge = function(userId) {
  this.acknowledgedBy = userId;
  this.acknowledgedAt = new Date();
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
