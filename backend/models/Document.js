const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentType: {
    type: String,
    enum: [
      'manual',
      'certificate',
      'warranty',
      'invoice',
      'report',
      'specification',
      'contract',
      'compliance',
      'training',
      'maintenance_log',
      'inspection_report',
      'safety_document',
      'other'
    ],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  mimeType: {
    type: String,
    required: true
  },
  fileExtension: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['Asset', 'Transaction', 'Maintenance', 'User', 'Base', 'Inventory', 'Supplier', 'Training'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String // Cache entity name for quick display
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'classified', 'confidential'],
    default: 'restricted'
  },
  classification: {
    level: {
      type: String,
      enum: ['unclassified', 'confidential', 'secret', 'top_secret']
    },
    caveat: String,
    declassificationDate: Date
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['technical', 'administrative', 'operational', 'financial', 'legal', 'training', 'safety']
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'expired', 'superseded', 'draft'],
    default: 'active'
  },
  expiryDate: Date,
  reviewDate: Date,
  approvalRequired: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_required'],
    default: 'not_required'
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastAccessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAccessedAt: Date,
  downloadCount: {
    type: Number,
    default: 0
  },
  accessLog: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['view', 'download', 'edit', 'delete']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  metadata: {
    author: String,
    subject: String,
    keywords: [String],
    language: {
      type: String,
      default: 'en'
    },
    pageCount: Number,
    wordCount: Number,
    createdWith: String
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: String, // Store encrypted key
  backupLocation: String,
  retentionPeriod: Number, // in months
  disposalDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ relatedEntity: 1, status: 1 });
documentSchema.index({ documentType: 1, status: 1 });
documentSchema.index({ baseId: 1, accessLevel: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiryDate: 1, status: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for expired status
documentSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for needs review status
documentSchema.virtual('needsReview').get(function() {
  return this.reviewDate && this.reviewDate < new Date();
});

// Pre-save middleware
documentSchema.pre('save', function(next) {
  // Update status if expired
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  
  // Set file extension from filename
  if (!this.fileExtension && this.filename) {
    this.fileExtension = this.filename.split('.').pop().toLowerCase();
  }
  
  // Set approval status based on access level
  if (this.accessLevel === 'classified' || this.accessLevel === 'confidential') {
    this.approvalRequired = true;
    if (this.approvalStatus === 'not_required') {
      this.approvalStatus = 'pending';
    }
  }
  
  next();
});

// Static method to find documents by entity
documentSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({
    'relatedEntity.type': entityType,
    'relatedEntity.id': entityId,
    status: { $in: ['active', 'draft'] }
  }).sort({ createdAt: -1 });
};

// Static method to find expired documents
documentSchema.statics.findExpired = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: 'active'
  }).populate('uploadedBy', 'firstName lastName rank');
};

// Static method to find documents needing review
documentSchema.statics.findNeedingReview = function() {
  return this.find({
    reviewDate: { $lt: new Date() },
    status: 'active'
  }).populate('uploadedBy', 'firstName lastName rank');
};

// Static method to find documents by access level
documentSchema.statics.findByAccessLevel = function(accessLevel, baseId = null) {
  const query = { accessLevel, status: 'active' };
  if (baseId) query.baseId = baseId;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to search documents
documentSchema.statics.searchDocuments = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: { $in: ['active', 'draft'] },
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Instance method to log access
documentSchema.methods.logAccess = function(userId, action, metadata = {}) {
  this.accessLog.push({
    userId,
    action,
    timestamp: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
  
  this.lastAccessedBy = userId;
  this.lastAccessedAt = new Date();
  
  if (action === 'download') {
    this.downloadCount += 1;
  }
  
  return this.save();
};

// Instance method to approve document
documentSchema.methods.approve = function(approvedBy) {
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalStatus = 'approved';
  
  if (this.status === 'draft') {
    this.status = 'active';
  }
  
  return this.save();
};

// Instance method to reject document
documentSchema.methods.reject = function() {
  this.approvalStatus = 'rejected';
  return this.save();
};

// Instance method to archive document
documentSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to check if user can access
documentSchema.methods.canAccess = function(user) {
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Check base access
  if (this.baseId.toString() !== user.baseId.toString()) return false;
  
  // Check access level permissions
  switch (this.accessLevel) {
    case 'public':
      return true;
    case 'restricted':
      return ['commander', 'logistics_officer'].includes(user.role);
    case 'classified':
    case 'confidential':
      return user.role === 'commander';
    default:
      return false;
  }
};

module.exports = mongoose.model('Document', documentSchema);
