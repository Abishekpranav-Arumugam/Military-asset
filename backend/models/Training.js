const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  trainingCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['equipment_operation', 'safety', 'maintenance', 'combat', 'leadership', 'technical', 'compliance', 'emergency_response'],
    required: true
  },
  trainingType: {
    type: String,
    enum: ['classroom', 'hands_on', 'simulation', 'field_exercise', 'online', 'hybrid'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  relatedAssets: [{
    assetCategory: {
      type: String,
      enum: ['vehicle', 'weapon', 'ammunition', 'equipment', 'supplies', 'technology'],
      required: true
    },
    specificModels: [String],
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  duration: {
    totalHours: {
      type: Number,
      required: true,
      min: 0.5
    },
    classroomHours: Number,
    practicalHours: Number,
    fieldHours: Number
  },
  prerequisites: [{
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training'
    },
    trainingCode: String,
    description: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  learningObjectives: [{
    objective: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['knowledge', 'skill', 'attitude'],
      required: true
    },
    assessmentMethod: String
  }],
  curriculum: [{
    module: {
      type: String,
      required: true
    },
    topics: [String],
    duration: Number, // in hours
    materials: [String],
    assessments: [{
      type: String,
      weight: Number, // percentage
      passingScore: Number
    }]
  }],
  certification: {
    issueCertificate: {
      type: Boolean,
      default: true
    },
    certificateName: String,
    validityPeriod: {
      type: Number, // in months
      default: 12
    },
    renewalRequired: {
      type: Boolean,
      default: true
    },
    renewalTrainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training'
    }
  },
  instructors: [{
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'assistant', 'subject_matter_expert', 'guest'],
      default: 'primary'
    },
    qualifications: [String],
    certificationDate: Date,
    certificationExpiry: Date
  }],
  schedule: [{
    sessionId: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      baseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Base'
      },
      facility: String,
      room: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    maxParticipants: {
      type: Number,
      default: 20
    },
    currentEnrollment: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
      default: 'scheduled'
    },
    instructorIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: String,
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'failed', 'withdrawn', 'no_show'],
      default: 'enrolled'
    },
    attendance: [{
      sessionDate: Date,
      present: Boolean,
      hoursAttended: Number,
      notes: String
    }],
    assessments: [{
      assessmentType: String,
      score: Number,
      maxScore: Number,
      passed: Boolean,
      attemptDate: Date,
      feedback: String
    }],
    finalScore: Number,
    finalGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', 'P', 'NP'] // Pass/No Pass
    },
    completionDate: Date,
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateNumber: String,
    certificateExpiryDate: Date,
    feedback: String,
    recommendations: String
  }],
  resources: {
    materials: [{
      name: String,
      type: {
        type: String,
        enum: ['manual', 'video', 'presentation', 'document', 'software', 'equipment']
      },
      location: String,
      isRequired: Boolean,
      cost: Number
    }],
    equipment: [{
      assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
      },
      quantity: Number,
      duration: Number, // hours needed
      isShared: Boolean
    }],
    facilities: [{
      name: String,
      type: String,
      capacity: Number,
      specialRequirements: [String]
    }]
  },
  compliance: {
    regulatoryRequirement: {
      type: Boolean,
      default: false
    },
    regulatingBody: String,
    complianceStandard: String,
    mandatoryFor: [String], // roles or positions
    frequency: {
      type: String,
      enum: ['one_time', 'annual', 'biannual', 'quarterly', 'as_needed']
    },
    nextDueDate: Date
  },
  evaluation: {
    instructorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    contentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    facilityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5
    },
    participantFeedback: [String],
    improvementSuggestions: [String],
    lastReviewDate: Date,
    nextReviewDate: Date
  },
  costs: {
    developmentCost: Number,
    instructorCost: Number,
    materialCost: Number,
    facilityCost: Number,
    totalCostPerParticipant: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'active', 'suspended', 'archived'],
    default: 'draft'
  },
  approvals: [{
    level: {
      type: String,
      enum: ['supervisor', 'training_officer', 'base_commander'],
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
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
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
trainingSchema.index({ trainingCode: 1 });
trainingSchema.index({ category: 1, status: 1 });
trainingSchema.index({ baseId: 1, status: 1 });
trainingSchema.index({ 'schedule.startDate': 1, 'schedule.status': 1 });
trainingSchema.index({ 'participants.userId': 1, 'participants.status': 1 });

// Virtual for completion rate
trainingSchema.virtual('completionRate').get(function() {
  if (this.participants.length === 0) return 0;
  const completed = this.participants.filter(p => p.status === 'completed').length;
  return Math.round((completed / this.participants.length) * 100);
});

// Virtual for pass rate
trainingSchema.virtual('passRate').get(function() {
  const completedParticipants = this.participants.filter(p => p.status === 'completed');
  if (completedParticipants.length === 0) return 0;
  
  const passed = completedParticipants.filter(p => 
    p.assessments.every(a => a.passed) || p.finalGrade !== 'F'
  ).length;
  
  return Math.round((passed / completedParticipants.length) * 100);
});

// Virtual for average rating
trainingSchema.virtual('averageRating').get(function() {
  const ratings = [
    this.evaluation.instructorRating,
    this.evaluation.contentRating,
    this.evaluation.facilityRating
  ].filter(r => r && r > 0);
  
  if (ratings.length === 0) return 0;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
});

// Pre-save middleware
trainingSchema.pre('save', function(next) {
  // Generate training code if not provided
  if (!this.trainingCode) {
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2);
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    this.trainingCode = `TRN-${categoryPrefix}${year}-${randomSuffix}`;
  }
  
  // Calculate overall rating
  if (this.evaluation.instructorRating && this.evaluation.contentRating && this.evaluation.facilityRating) {
    this.evaluation.overallRating = Math.round(
      ((this.evaluation.instructorRating + this.evaluation.contentRating + this.evaluation.facilityRating) / 3) * 10
    ) / 10;
  }
  
  next();
});

// Static method to find training by asset category
trainingSchema.statics.findByAssetCategory = function(assetCategory) {
  return this.find({
    'relatedAssets.assetCategory': assetCategory,
    status: 'active'
  }).sort({ title: 1 });
};

// Static method to find mandatory training
trainingSchema.statics.findMandatory = function() {
  return this.find({
    'compliance.regulatoryRequirement': true,
    status: 'active'
  }).sort({ 'compliance.nextDueDate': 1 });
};

// Static method to find upcoming sessions
trainingSchema.statics.findUpcomingSessions = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    'schedule.startDate': {
      $gte: new Date(),
      $lte: futureDate
    },
    'schedule.status': 'scheduled',
    status: 'active'
  }).sort({ 'schedule.startDate': 1 });
};

// Instance method to enroll participant
trainingSchema.methods.enrollParticipant = function(userId, sessionId = null) {
  // Check if already enrolled
  const existingEnrollment = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('User is already enrolled in this training');
  }
  
  // Find available session if not specified
  if (!sessionId && this.schedule.length > 0) {
    const availableSession = this.schedule.find(s => 
      s.status === 'scheduled' && 
      s.currentEnrollment < s.maxParticipants
    );
    
    if (availableSession) {
      sessionId = availableSession.sessionId;
      availableSession.currentEnrollment += 1;
    }
  }
  
  this.participants.push({
    userId,
    sessionId,
    enrollmentDate: new Date(),
    status: 'enrolled'
  });
  
  return this.save();
};

// Instance method to record attendance
trainingSchema.methods.recordAttendance = function(userId, sessionDate, present, hoursAttended = 0, notes = '') {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  participant.attendance.push({
    sessionDate,
    present,
    hoursAttended,
    notes
  });
  
  // Update status if in progress
  if (participant.status === 'enrolled') {
    participant.status = 'in_progress';
  }
  
  return this.save();
};

// Instance method to record assessment
trainingSchema.methods.recordAssessment = function(userId, assessmentType, score, maxScore, feedback = '') {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  const passed = score >= (maxScore * 0.7); // 70% passing score
  
  participant.assessments.push({
    assessmentType,
    score,
    maxScore,
    passed,
    attemptDate: new Date(),
    feedback
  });
  
  return this.save();
};

// Instance method to complete training
trainingSchema.methods.completeTraining = function(userId, finalScore, finalGrade, feedback = '') {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  participant.status = finalGrade === 'F' ? 'failed' : 'completed';
  participant.finalScore = finalScore;
  participant.finalGrade = finalGrade;
  participant.completionDate = new Date();
  participant.feedback = feedback;
  
  // Issue certificate if passed and certification is enabled
  if (participant.status === 'completed' && this.certification.issueCertificate) {
    participant.certificateIssued = true;
    participant.certificateNumber = `${this.trainingCode}-${Date.now()}`;
    
    if (this.certification.validityPeriod) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + this.certification.validityPeriod);
      participant.certificateExpiryDate = expiryDate;
    }
  }
  
  return this.save();
};

// Instance method to get participants needing renewal
trainingSchema.methods.getParticipantsNeedingRenewal = function(daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.participants.filter(p => 
    p.certificateExpiryDate && 
    p.certificateExpiryDate <= futureDate &&
    p.status === 'completed'
  );
};

module.exports = mongoose.model('Training', trainingSchema);
