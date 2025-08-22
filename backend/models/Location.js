const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  locationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true
  },
  type: {
    type: String,
    enum: ['warehouse', 'armory', 'garage', 'office', 'barracks', 'hangar', 'field', 'storage', 'workshop', 'command_center', 'medical', 'communications'],
    required: true
  },
  subType: {
    type: String,
    enum: ['indoor', 'outdoor', 'covered', 'secure', 'climate_controlled', 'hazmat_approved']
  },
  building: {
    name: String,
    number: String,
    floor: String
  },
  room: {
    number: String,
    name: String,
    suite: String
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    elevation: Number, // in meters
    accuracy: Number // GPS accuracy in meters
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  dimensions: {
    length: Number, // in meters
    width: Number,
    height: Number,
    area: Number, // calculated in square meters
    volume: Number // calculated in cubic meters
  },
  capacity: {
    maxWeight: Number, // in kg
    maxVolume: Number, // in cubic meters
    maxItems: Number,
    currentWeight: {
      type: Number,
      default: 0
    },
    currentVolume: {
      type: Number,
      default: 0
    },
    currentItems: {
      type: Number,
      default: 0
    }
  },
  environmental: {
    temperature: {
      min: Number, // Celsius
      max: Number,
      current: Number,
      controlled: {
        type: Boolean,
        default: false
      }
    },
    humidity: {
      min: Number, // percentage
      max: Number,
      current: Number,
      controlled: {
        type: Boolean,
        default: false
      }
    },
    lighting: {
      type: String,
      enum: ['natural', 'artificial', 'both', 'none']
    },
    ventilation: {
      type: String,
      enum: ['natural', 'mechanical', 'both', 'none']
    },
    powerSupply: {
      type: String,
      enum: ['grid', 'generator', 'battery', 'solar', 'multiple']
    }
  },
  security: {
    accessLevel: {
      type: String,
      enum: ['public', 'restricted', 'classified', 'top_secret'],
      default: 'restricted'
    },
    clearanceRequired: {
      type: String,
      enum: ['none', 'confidential', 'secret', 'top_secret']
    },
    accessControl: {
      type: String,
      enum: ['none', 'key', 'keycard', 'biometric', 'multi_factor'],
      default: 'key'
    },
    surveillance: {
      cameras: {
        type: Boolean,
        default: false
      },
      motionSensors: {
        type: Boolean,
        default: false
      },
      alarms: {
        type: Boolean,
        default: false
      }
    },
    guards: {
      required: {
        type: Boolean,
        default: false
      },
      schedule: String
    }
  },
  safety: {
    fireSuppressionSystem: {
      type: String,
      enum: ['none', 'sprinkler', 'gas', 'foam', 'dry_chemical']
    },
    emergencyExits: Number,
    firstAidKit: {
      type: Boolean,
      default: false
    },
    emergencyEquipment: [String],
    hazardousArea: {
      type: Boolean,
      default: false
    },
    hazardTypes: [{
      type: String,
      enum: ['chemical', 'biological', 'radiological', 'explosive', 'electrical', 'mechanical']
    }],
    safetyProtocols: [String]
  },
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
    position: {
      zone: String,
      rack: String,
      shelf: String,
      bin: String,
      coordinates: {
        x: Number,
        y: Number,
        z: Number
      }
    },
    status: {
      type: String,
      enum: ['stored', 'in_use', 'maintenance', 'reserved', 'quarantine'],
      default: 'stored'
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    },
    lastInspected: Date,
    notes: String
  }],
  zones: [{
    name: {
      type: String,
      required: true
    },
    code: String,
    description: String,
    coordinates: {
      x1: Number, // top-left
      y1: Number,
      x2: Number, // bottom-right
      y2: Number
    },
    capacity: {
      maxItems: Number,
      currentItems: {
        type: Number,
        default: 0
      }
    },
    restrictions: [String],
    purpose: String
  }],
  equipment: [{
    name: String,
    type: {
      type: String,
      enum: ['hvac', 'lighting', 'security', 'communication', 'power', 'safety', 'material_handling']
    },
    model: String,
    serialNumber: String,
    status: {
      type: String,
      enum: ['operational', 'maintenance', 'broken', 'offline'],
      default: 'operational'
    },
    lastMaintenance: Date,
    nextMaintenance: Date
  }],
  accessLog: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['enter', 'exit', 'asset_move', 'inspection', 'maintenance'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    purpose: String,
    duration: Number, // in minutes
    assetsAccessed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    }],
    notes: String
  }],
  inspections: [{
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    inspectionDate: {
      type: Date,
      default: Date.now
    },
    inspectionType: {
      type: String,
      enum: ['routine', 'safety', 'security', 'inventory', 'maintenance', 'compliance'],
      required: true
    },
    findings: [String],
    issues: [{
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String,
      correctionRequired: Boolean,
      dueDate: Date,
      status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
      }
    }],
    overallRating: {
      type: String,
      enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory']
    },
    nextInspectionDate: Date,
    notes: String
  }],
  responsibleOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alternateOfficers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
    is24x7: {
      type: Boolean,
      default: false
    },
    specialHours: [{
      date: Date,
      open: String,
      close: String,
      reason: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'renovation', 'decommissioned'],
    default: 'active'
  },
  notes: String,
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
locationSchema.index({ locationCode: 1 });
locationSchema.index({ baseId: 1, type: 1 });
locationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
locationSchema.index({ responsibleOfficer: 1 });
locationSchema.index({ status: 1 });
locationSchema.index({ 'assets.assetId': 1 });

// Virtual for capacity utilization percentage
locationSchema.virtual('capacity.utilizationPercentage').get(function() {
  if (this.capacity.maxItems === 0) return 0;
  return Math.round((this.capacity.currentItems / this.capacity.maxItems) * 100);
});

// Virtual for weight utilization percentage
locationSchema.virtual('capacity.weightUtilizationPercentage').get(function() {
  if (this.capacity.maxWeight === 0) return 0;
  return Math.round((this.capacity.currentWeight / this.capacity.maxWeight) * 100);
});

// Virtual for volume utilization percentage
locationSchema.virtual('capacity.volumeUtilizationPercentage').get(function() {
  if (this.capacity.maxVolume === 0) return 0;
  return Math.round((this.capacity.currentVolume / this.capacity.maxVolume) * 100);
});

// Virtual for calculated area
locationSchema.virtual('dimensions.calculatedArea').get(function() {
  if (this.dimensions.length && this.dimensions.width) {
    return Math.round(this.dimensions.length * this.dimensions.width * 100) / 100;
  }
  return this.dimensions.area || 0;
});

// Virtual for calculated volume
locationSchema.virtual('dimensions.calculatedVolume').get(function() {
  if (this.dimensions.length && this.dimensions.width && this.dimensions.height) {
    return Math.round(this.dimensions.length * this.dimensions.width * this.dimensions.height * 100) / 100;
  }
  return this.dimensions.volume || 0;
});

// Pre-save middleware
locationSchema.pre('save', function(next) {
  // Generate location code if not provided
  if (!this.locationCode) {
    const typePrefix = this.type.substring(0, 3).toUpperCase();
    const buildingPrefix = this.building.number || this.building.name?.substring(0, 2) || 'XX';
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    this.locationCode = `${typePrefix}-${buildingPrefix}-${randomSuffix}`;
  }
  
  // Calculate area and volume if dimensions are provided
  if (this.dimensions.length && this.dimensions.width) {
    this.dimensions.area = Math.round(this.dimensions.length * this.dimensions.width * 100) / 100;
    
    if (this.dimensions.height) {
      this.dimensions.volume = Math.round(this.dimensions.length * this.dimensions.width * this.dimensions.height * 100) / 100;
    }
  }
  
  // Update current capacity counts
  this.capacity.currentItems = this.assets.reduce((total, asset) => total + asset.quantity, 0);
  
  next();
});

// Static method to find locations by type
locationSchema.statics.findByType = function(type, baseId = null) {
  const query = { type, status: 'active' };
  if (baseId) query.baseId = baseId;
  
  return this.find(query).sort({ name: 1 });
};

// Static method to find available locations
locationSchema.statics.findAvailable = function(requiredCapacity = 1) {
  return this.find({
    status: 'active',
    $expr: {
      $gte: [
        { $subtract: ['$capacity.maxItems', '$capacity.currentItems'] },
        requiredCapacity
      ]
    }
  }).sort({ 'capacity.utilizationPercentage': 1 });
};

// Static method to find locations needing inspection
locationSchema.statics.findNeedingInspection = function() {
  const today = new Date();
  return this.find({
    $or: [
      { 'inspections.nextInspectionDate': { $lte: today } },
      { 'inspections.nextInspectionDate': { $exists: false } },
      { inspections: { $size: 0 } }
    ],
    status: 'active'
  });
};

// Instance method to add asset
locationSchema.methods.addAsset = function(assetId, quantity, position = {}) {
  // Check capacity
  if (this.capacity.maxItems && (this.capacity.currentItems + quantity) > this.capacity.maxItems) {
    throw new Error('Location capacity exceeded');
  }
  
  // Check if asset already exists at this location
  const existingAsset = this.assets.find(a => a.assetId.toString() === assetId.toString());
  
  if (existingAsset) {
    existingAsset.quantity += quantity;
  } else {
    this.assets.push({
      assetId,
      quantity,
      assignedDate: new Date(),
      position,
      status: 'stored',
      condition: 'good'
    });
  }
  
  return this.save();
};

// Instance method to remove asset
locationSchema.methods.removeAsset = function(assetId, quantity = null) {
  const assetIndex = this.assets.findIndex(a => a.assetId.toString() === assetId.toString());
  
  if (assetIndex === -1) {
    throw new Error('Asset not found at this location');
  }
  
  const asset = this.assets[assetIndex];
  
  if (quantity === null || quantity >= asset.quantity) {
    // Remove entire asset entry
    this.assets.splice(assetIndex, 1);
  } else {
    // Reduce quantity
    asset.quantity -= quantity;
  }
  
  return this.save();
};

// Instance method to log access
locationSchema.methods.logAccess = function(userId, action, purpose = '', assetsAccessed = []) {
  this.accessLog.push({
    userId,
    action,
    timestamp: new Date(),
    purpose,
    assetsAccessed,
    notes: ''
  });
  
  // Keep only last 1000 access log entries
  if (this.accessLog.length > 1000) {
    this.accessLog = this.accessLog.slice(-1000);
  }
  
  return this.save();
};

// Instance method to conduct inspection
locationSchema.methods.conductInspection = function(inspectorId, inspectionType, findings = [], issues = []) {
  const inspection = {
    inspectorId,
    inspectionDate: new Date(),
    inspectionType,
    findings,
    issues,
    notes: ''
  };
  
  // Set next inspection date based on type
  const nextInspectionDays = {
    routine: 90,
    safety: 30,
    security: 60,
    inventory: 180,
    maintenance: 365,
    compliance: 90
  };
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (nextInspectionDays[inspectionType] || 90));
  inspection.nextInspectionDate = nextDate;
  
  // Determine overall rating based on issues
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  
  if (criticalIssues > 0) {
    inspection.overallRating = 'unsatisfactory';
  } else if (highIssues > 2) {
    inspection.overallRating = 'needs_improvement';
  } else if (highIssues > 0 || mediumIssues > 3) {
    inspection.overallRating = 'satisfactory';
  } else if (mediumIssues > 0) {
    inspection.overallRating = 'good';
  } else {
    inspection.overallRating = 'excellent';
  }
  
  this.inspections.push(inspection);
  
  return this.save();
};

// Instance method to get available capacity
locationSchema.methods.getAvailableCapacity = function() {
  return {
    items: Math.max(0, (this.capacity.maxItems || 0) - this.capacity.currentItems),
    weight: Math.max(0, (this.capacity.maxWeight || 0) - this.capacity.currentWeight),
    volume: Math.max(0, (this.capacity.maxVolume || 0) - this.capacity.currentVolume)
  };
};

module.exports = mongoose.model('Location', locationSchema);
