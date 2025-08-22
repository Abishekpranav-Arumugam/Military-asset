const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'emergency', 'inspection'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'scheduled'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number, // in hours
    min: 0
  },
  actualDuration: {
    type: Number, // in hours
    min: 0
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  parts: [{
    partName: {
      type: String,
      required: true
    },
    partNumber: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitCost: {
      type: Number,
      min: 0
    },
    supplier: String
  }],
  workPerformed: [{
    task: {
      type: String,
      required: true
    },
    timeSpent: Number, // in hours
    notes: String,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  nextMaintenanceDate: Date,
  nextMaintenanceType: {
    type: String,
    enum: ['preventive', 'inspection']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: Number, // in days
    min: 1
  },
  lastRecurrenceDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
maintenanceSchema.index({ assetId: 1, scheduledDate: 1 });
maintenanceSchema.index({ status: 1, scheduledDate: 1 });
maintenanceSchema.index({ baseId: 1, status: 1 });
maintenanceSchema.index({ maintenanceType: 1, scheduledDate: 1 });

// Virtual for total parts cost
maintenanceSchema.virtual('totalPartsCost').get(function() {
  return this.parts.reduce((total, part) => {
    return total + (part.quantity * (part.unitCost || 0));
  }, 0);
});

// Virtual for overdue status
maintenanceSchema.virtual('isOverdue').get(function() {
  return this.status === 'scheduled' && this.scheduledDate < new Date();
});

// Pre-save middleware to update status if overdue
maintenanceSchema.pre('save', function(next) {
  if (this.status === 'scheduled' && this.scheduledDate < new Date()) {
    this.status = 'overdue';
  }
  
  // Set completed date when status changes to completed
  if (this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  // Calculate actual cost from parts if not set
  if (!this.actualCost && this.parts.length > 0) {
    this.actualCost = this.totalPartsCost;
  }
  
  next();
});

// Static method to find overdue maintenance
maintenanceSchema.statics.findOverdue = function() {
  return this.find({
    status: { $in: ['scheduled', 'overdue'] },
    scheduledDate: { $lt: new Date() }
  }).populate('assetId', 'name serialNumber category')
    .populate('assignedTo', 'firstName lastName rank');
};

// Static method to find upcoming maintenance
maintenanceSchema.statics.findUpcoming = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'scheduled',
    scheduledDate: { 
      $gte: new Date(),
      $lte: futureDate 
    }
  }).populate('assetId', 'name serialNumber category')
    .populate('assignedTo', 'firstName lastName rank');
};

// Instance method to calculate maintenance cost
maintenanceSchema.methods.calculateTotalCost = function() {
  const partsCost = this.totalPartsCost;
  const laborCost = this.actualCost || this.estimatedCost || 0;
  return partsCost + laborCost;
};

// Instance method to schedule next maintenance
maintenanceSchema.methods.scheduleNext = function() {
  if (this.isRecurring && this.recurringInterval) {
    const nextDate = new Date(this.completedDate || this.scheduledDate);
    nextDate.setDate(nextDate.getDate() + this.recurringInterval);
    
    return {
      assetId: this.assetId,
      maintenanceType: this.nextMaintenanceType || 'preventive',
      scheduledDate: nextDate,
      title: `Recurring: ${this.title}`,
      description: this.description,
      estimatedCost: this.estimatedCost,
      estimatedDuration: this.estimatedDuration,
      baseId: this.baseId,
      isRecurring: true,
      recurringInterval: this.recurringInterval,
      createdBy: this.createdBy
    };
  }
  return null;
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);
