const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  operationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  missionType: {
    type: String,
    enum: ['training', 'combat', 'humanitarian', 'peacekeeping', 'reconnaissance', 'logistics', 'security'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  classification: {
    level: {
      type: String,
      enum: ['unclassified', 'confidential', 'secret', 'top_secret'],
      default: 'unclassified'
    },
    caveat: String
  },
  location: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    country: String,
    region: String,
    terrain: {
      type: String,
      enum: ['urban', 'desert', 'forest', 'mountain', 'coastal', 'arctic']
    },
    climate: String
  },
  timeline: {
    plannedStartDate: {
      type: Date,
      required: true
    },
    plannedEndDate: {
      type: Date,
      required: true
    },
    actualStartDate: Date,
    actualEndDate: Date,
    estimatedDuration: Number, // in days
    actualDuration: Number // in days
  },
  status: {
    type: String,
    enum: ['planned', 'approved', 'preparing', 'active', 'completed', 'cancelled', 'suspended'],
    default: 'planned'
  },
  command: {
    commanderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deputyCommanderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    operationsOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    logisticsOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  personnel: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'deployed', 'returned', 'casualty', 'missing'],
      default: 'assigned'
    },
    specializations: [String],
    clearanceLevel: String
  }],
  assets: [{
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    returnedDate: Date,
    status: {
      type: String,
      enum: ['assigned', 'deployed', 'in_use', 'maintenance', 'damaged', 'lost', 'returned'],
      default: 'assigned'
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    },
    notes: String
  }],
  objectives: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    priority: {
      type: String,
      enum: ['primary', 'secondary', 'tertiary'],
      default: 'primary'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    completedDate: Date,
    successCriteria: [String],
    notes: String
  }],
  logistics: {
    supplyRequirements: [{
      itemType: String,
      quantity: Number,
      unit: String,
      priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['requested', 'approved', 'procured', 'delivered'],
        default: 'requested'
      }
    }],
    transportationPlan: String,
    communicationPlan: String,
    medicalSupport: String,
    evacuationPlan: String
  },
  budget: {
    allocatedAmount: {
      type: Number,
      min: 0
    },
    spentAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    expenses: [{
      category: String,
      amount: Number,
      description: String,
      date: {
        type: Date,
        default: Date.now
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  risks: [{
    type: {
      type: String,
      enum: ['operational', 'security', 'environmental', 'political', 'logistical', 'technical'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    probability: {
      type: String,
      enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
      required: true
    },
    impact: {
      type: String,
      enum: ['negligible', 'minor', 'moderate', 'major', 'catastrophic'],
      required: true
    },
    mitigationPlan: String,
    contingencyPlan: String,
    status: {
      type: String,
      enum: ['identified', 'assessed', 'mitigated', 'accepted', 'occurred'],
      default: 'identified'
    }
  }],
  reports: [{
    type: {
      type: String,
      enum: ['sitrep', 'after_action', 'intelligence', 'logistics', 'casualty'],
      required: true
    },
    title: String,
    content: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    classification: {
      type: String,
      enum: ['unclassified', 'confidential', 'secret', 'top_secret'],
      default: 'unclassified'
    }
  }],
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  parentDeployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  },
  subDeployments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment'
  }],
  approvals: [{
    level: {
      type: String,
      enum: ['base_commander', 'regional_commander', 'joint_chiefs', 'secretary_defense'],
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String
  }],
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
deploymentSchema.index({ operationCode: 1 });
deploymentSchema.index({ status: 1, 'timeline.plannedStartDate': 1 });
deploymentSchema.index({ missionType: 1, status: 1 });
deploymentSchema.index({ baseId: 1, status: 1 });
deploymentSchema.index({ 'command.commanderId': 1 });
deploymentSchema.index({ 'location.country': 1, 'location.region': 1 });

// Virtual for deployment duration
deploymentSchema.virtual('timeline.plannedDurationDays').get(function() {
  if (this.timeline.plannedStartDate && this.timeline.plannedEndDate) {
    const diffTime = Math.abs(this.timeline.plannedEndDate - this.timeline.plannedStartDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for actual duration
deploymentSchema.virtual('timeline.actualDurationDays').get(function() {
  if (this.timeline.actualStartDate && this.timeline.actualEndDate) {
    const diffTime = Math.abs(this.timeline.actualEndDate - this.timeline.actualStartDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for budget utilization percentage
deploymentSchema.virtual('budget.utilizationPercentage').get(function() {
  if (this.budget.allocatedAmount === 0) return 0;
  return Math.round((this.budget.spentAmount / this.budget.allocatedAmount) * 100);
});

// Virtual for personnel count
deploymentSchema.virtual('personnelCount').get(function() {
  return this.personnel.length;
});

// Virtual for asset count
deploymentSchema.virtual('assetCount').get(function() {
  return this.assets.reduce((total, asset) => total + asset.quantity, 0);
});

// Pre-save middleware
deploymentSchema.pre('save', function(next) {
  // Generate operation code if not provided
  if (!this.operationCode) {
    const namePrefix = this.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const datePrefix = new Date().getFullYear().toString().slice(-2);
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    this.operationCode = `OP-${namePrefix}${datePrefix}-${randomSuffix}`;
  }
  
  // Update actual duration when status changes to completed
  if (this.status === 'completed' && this.timeline.actualStartDate && !this.timeline.actualEndDate) {
    this.timeline.actualEndDate = new Date();
  }
  
  // Calculate actual duration
  if (this.timeline.actualStartDate && this.timeline.actualEndDate) {
    const diffTime = Math.abs(this.timeline.actualEndDate - this.timeline.actualStartDate);
    this.timeline.actualDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  next();
});

// Static method to find active deployments
deploymentSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['active', 'preparing'] }
  }).populate('command.commanderId', 'firstName lastName rank')
    .populate('baseId', 'name location');
};

// Static method to find deployments by commander
deploymentSchema.statics.findByCommander = function(commanderId) {
  return this.find({
    'command.commanderId': commanderId
  }).sort({ 'timeline.plannedStartDate': -1 });
};

// Static method to find deployments by location
deploymentSchema.statics.findByLocation = function(country, region = null) {
  const query = { 'location.country': country };
  if (region) query['location.region'] = region;
  
  return this.find(query).sort({ 'timeline.plannedStartDate': -1 });
};

// Instance method to calculate risk score
deploymentSchema.methods.calculateRiskScore = function() {
  if (this.risks.length === 0) return 0;
  
  const riskWeights = {
    probability: { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 },
    impact: { negligible: 1, minor: 2, moderate: 3, major: 4, catastrophic: 5 }
  };
  
  const totalRisk = this.risks.reduce((sum, risk) => {
    const probWeight = riskWeights.probability[risk.probability] || 3;
    const impactWeight = riskWeights.impact[risk.impact] || 3;
    return sum + (probWeight * impactWeight);
  }, 0);
  
  return Math.round(totalRisk / this.risks.length);
};

// Instance method to get deployment readiness
deploymentSchema.methods.getReadinessStatus = function() {
  const requiredApprovals = this.approvals.filter(a => a.status === 'approved').length;
  const totalApprovals = this.approvals.length;
  const personnelReady = this.personnel.filter(p => p.status === 'assigned').length;
  const assetsReady = this.assets.filter(a => a.status === 'assigned').length;
  
  const approvalScore = totalApprovals > 0 ? (requiredApprovals / totalApprovals) * 100 : 0;
  const personnelScore = this.personnel.length > 0 ? (personnelReady / this.personnel.length) * 100 : 100;
  const assetScore = this.assets.length > 0 ? (assetsReady / this.assets.length) * 100 : 100;
  
  const overallReadiness = Math.round((approvalScore + personnelScore + assetScore) / 3);
  
  return {
    overall: overallReadiness,
    approvals: approvalScore,
    personnel: personnelScore,
    assets: assetScore,
    status: overallReadiness >= 90 ? 'ready' : overallReadiness >= 70 ? 'mostly_ready' : 'not_ready'
  };
};

// Instance method to add personnel
deploymentSchema.methods.addPersonnel = function(userId, role, specializations = []) {
  this.personnel.push({
    userId,
    role,
    specializations,
    assignedDate: new Date(),
    status: 'assigned'
  });
  return this.save();
};

// Instance method to add asset
deploymentSchema.methods.addAsset = function(assetId, quantity, notes = '') {
  this.assets.push({
    assetId,
    quantity,
    assignedDate: new Date(),
    status: 'assigned',
    condition: 'good',
    notes
  });
  return this.save();
};

module.exports = mongoose.model('Deployment', deploymentSchema);
