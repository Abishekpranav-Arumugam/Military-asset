const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'create', 'update', 'delete', 'view',
      'purchase', 'transfer', 'assignment', 'expenditure',
      'approve', 'reject', 'cancel', 'export' // Added export
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
        'user', 'base', 'asset', 'transaction', 'dashboard', 'audit_log',
        'maintenance', 'deployment', 'incident', 'training', 'location'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // --- CHANGE IS HERE ---
  details: {
    type: String // Changed from a Map to a simple String
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base'
  }
}, {
  timestamps: true
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ baseId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);