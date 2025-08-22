const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  incidentType: {
    type: String,
    enum: ['damage', 'theft', 'accident', 'malfunction', 'security_breach', 'safety_violation', 'environmental', 'personnel_injury', 'equipment_failure', 'cyber_incident'],
    required: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical', 'catastrophic'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  location: {
    baseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Base',
      required: true
    },
    specificLocation: {
      type: String,
      required: true
    },
    building: String,
    room: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  dateTimeOccurred: {
    type: Date,
    required: true
  },
  dateTimeReported: {
    type: Date,
    default: Date.now
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discoveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  involvedAssets: [{
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    damageLevel: {
      type: String,
      enum: ['none', 'minor', 'moderate', 'major', 'total_loss'],
      default: 'none'
    },
    estimatedRepairCost: Number,
    actualRepairCost: Number,
    repairStatus: {
      type: String,
      enum: ['not_required', 'pending', 'in_progress', 'completed', 'beyond_repair'],
      default: 'not_required'
    },
    replacementRequired: {
      type: Boolean,
      default: false
    }
  }],
  involvedPersonnel: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['victim', 'witness', 'operator', 'supervisor', 'investigator', 'responder'],
      required: true
    },
    injuryLevel: {
      type: String,
      enum: ['none', 'minor', 'moderate', 'serious', 'critical', 'fatal']
    },
    medicalAttention: {
      type: Boolean,
      default: false
    },
    statement: String,
    statementDate: Date
  }],
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'investigating', 'under_review', 'resolved', 'closed', 'escalated'],
    default: 'reported'
  },
  investigation: {
    investigatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    expectedCompletionDate: Date,
    actualCompletionDate: Date,
    findings: String,
    rootCause: String,
    contributingFactors: [String],
    evidenceCollected: [{
      type: String,
      description: String,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      collectedDate: {
        type: Date,
        default: Date.now
      },
      location: String
    }],
    interviews: [{
      intervieweeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      interviewDate: Date,
      interviewerIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      summary: String,
      keyPoints: [String]
    }],
    timeline: [{
      timestamp: Date,
      event: String,
      source: String
    }]
  },
  immediateActions: [{
    action: {
      type: String,
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    notes: String
  }],
  correctiveActions: [{
    action: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['procedural', 'training', 'equipment', 'policy', 'environmental', 'organizational']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['planned', 'approved', 'in_progress', 'completed', 'cancelled'],
      default: 'planned'
    },
    effectiveness: {
      type: String,
      enum: ['not_assessed', 'ineffective', 'partially_effective', 'effective', 'highly_effective']
    },
    notes: String
  }],
  preventiveActions: [{
    action: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['policy_change', 'training_program', 'equipment_upgrade', 'procedure_modification', 'safety_measure']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetDate: Date,
    implementedDate: Date,
    status: {
      type: String,
      enum: ['proposed', 'approved', 'in_progress', 'implemented', 'cancelled'],
      default: 'proposed'
    },
    notes: String
  }],
  costs: {
    estimatedTotalCost: Number,
    actualTotalCost: Number,
    repairCosts: Number,
    replacementCosts: Number,
    medicalCosts: Number,
    legalCosts: Number,
    operationalLosses: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  notifications: [{
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationType: {
      type: String,
      enum: ['immediate', 'daily_report', 'weekly_summary', 'escalation']
    },
    sentDate: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'system_notification', 'phone_call']
    }
  }],
  relatedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
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
    },
    category: {
      type: String,
      enum: ['photo', 'document', 'video', 'audio', 'report']
    }
  }],
  classification: {
    level: {
      type: String,
      enum: ['unclassified', 'confidential', 'secret'],
      default: 'unclassified'
    },
    reason: String
  },
  regulatoryReporting: {
    required: {
      type: Boolean,
      default: false
    },
    agencies: [String],
    reportedDate: Date,
    reportNumber: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },
  lessonsLearned: [{
    lesson: String,
    category: String,
    applicability: String,
    sharedWith: [String],
    dateShared: Date
  }],
  reviewBoard: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    completedDate: Date,
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    recommendations: [String],
    decision: String
  },
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
incidentSchema.index({ incidentNumber: 1 });
incidentSchema.index({ incidentType: 1, severity: 1 });
incidentSchema.index({ status: 1, dateTimeOccurred: -1 });
incidentSchema.index({ 'location.baseId': 1, status: 1 });
incidentSchema.index({ reportedBy: 1, dateTimeReported: -1 });
incidentSchema.index({ 'investigation.investigatorId': 1 });

// Virtual for days since reported
incidentSchema.virtual('daysSinceReported').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.dateTimeReported);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for investigation duration
incidentSchema.virtual('investigation.durationDays').get(function() {
  if (this.investigation.startDate && this.investigation.actualCompletionDate) {
    const diffTime = Math.abs(this.investigation.actualCompletionDate - this.investigation.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total estimated cost
incidentSchema.virtual('costs.totalEstimated').get(function() {
  return (this.costs.repairCosts || 0) + 
         (this.costs.replacementCosts || 0) + 
         (this.costs.medicalCosts || 0) + 
         (this.costs.legalCosts || 0) + 
         (this.costs.operationalLosses || 0);
});

// Pre-save middleware to generate incident number
incidentSchema.pre('save', function(next) {
  if (!this.incidentNumber) {
    const year = new Date().getFullYear();
    const typePrefix = this.incidentType.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    this.incidentNumber = `INC-${year}-${typePrefix}-${randomSuffix}`;
  }
  
  // Auto-calculate total costs
  if (!this.costs.estimatedTotalCost) {
    this.costs.estimatedTotalCost = this.costs.totalEstimated;
  }
  
  next();
});

// Static method to find critical incidents
incidentSchema.statics.findCritical = function() {
  return this.find({
    severity: { $in: ['critical', 'catastrophic'] },
    status: { $nin: ['closed', 'resolved'] }
  }).populate('reportedBy', 'firstName lastName rank')
    .populate('location.baseId', 'name')
    .sort({ dateTimeOccurred: -1 });
};

// Static method to find open incidents
incidentSchema.statics.findOpen = function() {
  return this.find({
    status: { $nin: ['closed', 'resolved'] }
  }).populate('reportedBy', 'firstName lastName rank')
    .populate('investigation.investigatorId', 'firstName lastName rank')
    .sort({ priority: 1, dateTimeOccurred: -1 });
};

// Static method to find incidents by type and date range
incidentSchema.statics.findByTypeAndDateRange = function(incidentType, startDate, endDate) {
  const query = { incidentType };
  if (startDate || endDate) {
    query.dateTimeOccurred = {};
    if (startDate) query.dateTimeOccurred.$gte = new Date(startDate);
    if (endDate) query.dateTimeOccurred.$lte = new Date(endDate);
  }
  
  return this.find(query).sort({ dateTimeOccurred: -1 });
};

// Instance method to calculate severity score
incidentSchema.methods.calculateSeverityScore = function() {
  const severityWeights = {
    minor: 1,
    moderate: 2,
    major: 3,
    critical: 4,
    catastrophic: 5
  };
  
  const typeWeights = {
    safety_violation: 1.2,
    personnel_injury: 1.5,
    security_breach: 1.3,
    equipment_failure: 1.0,
    damage: 1.1,
    theft: 1.2,
    accident: 1.3,
    malfunction: 1.0,
    environmental: 1.4,
    cyber_incident: 1.6
  };
  
  const baseSeverity = severityWeights[this.severity] || 2;
  const typeMultiplier = typeWeights[this.incidentType] || 1.0;
  
  return Math.round(baseSeverity * typeMultiplier * 10) / 10;
};

// Instance method to assign investigator
incidentSchema.methods.assignInvestigator = function(investigatorId, expectedCompletionDays = 30) {
  this.investigation.investigatorId = investigatorId;
  this.investigation.startDate = new Date();
  
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + expectedCompletionDays);
  this.investigation.expectedCompletionDate = expectedDate;
  
  this.status = 'investigating';
  
  return this.save();
};

// Instance method to add corrective action
incidentSchema.methods.addCorrectiveAction = function(action, category, assignedTo, dueDate) {
  this.correctiveActions.push({
    action,
    category,
    assignedTo,
    dueDate,
    status: 'planned'
  });
  
  return this.save();
};

// Instance method to close incident
incidentSchema.methods.closeIncident = function(userId) {
  this.status = 'closed';
  this.updatedBy = userId;
  
  // Mark investigation as completed if not already
  if (this.investigation.investigatorId && !this.investigation.actualCompletionDate) {
    this.investigation.actualCompletionDate = new Date();
  }
  
  return this.save();
};

// Instance method to escalate incident
incidentSchema.methods.escalate = function(reason) {
  this.status = 'escalated';
  this.priority = 'urgent';
  
  // Add to immediate actions
  this.immediateActions.push({
    action: `Incident escalated: ${reason}`,
    status: 'pending'
  });
  
  return this.save();
};

module.exports = mongoose.model('Incident', incidentSchema);
