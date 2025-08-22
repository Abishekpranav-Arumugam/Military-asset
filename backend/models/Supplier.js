const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  supplierCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  contactPerson: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    title: String,
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    mobile: String
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'USA'
    }
  },
  supplierType: [{
    type: String,
    enum: ['equipment', 'ammunition', 'supplies', 'vehicles', 'services', 'maintenance', 'technology'],
    required: true
  }],
  categories: [{
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment', 'supplies', 'technology', 'services']
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    number: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'suspended'],
      default: 'active'
    }
  }],
  contractDetails: {
    contractNumber: String,
    contractType: {
      type: String,
      enum: ['fixed_price', 'cost_plus', 'time_materials', 'indefinite_delivery']
    },
    startDate: Date,
    endDate: Date,
    totalValue: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentTerms: String,
    deliveryTerms: String
  },
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    lastEvaluationDate: Date,
    notes: String
  },
  financialInfo: {
    taxId: String,
    dunsNumber: String,
    cageCode: String,
    creditRating: String,
    paymentHistory: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  capabilities: [{
    capability: String,
    description: String,
    capacity: String,
    certificationRequired: Boolean
  }],
  products: [{
    name: String,
    description: String,
    category: String,
    unitPrice: Number,
    minimumOrder: Number,
    leadTime: Number, // in days
    specifications: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPreferred: {
    type: Boolean,
    default: false
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  complianceStatus: {
    type: String,
    enum: ['compliant', 'non_compliant', 'under_review'],
    default: 'compliant'
  },
  lastAuditDate: Date,
  nextAuditDate: Date,
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
supplierSchema.index({ name: 1 });
supplierSchema.index({ supplierCode: 1 });
supplierSchema.index({ supplierType: 1, isActive: 1 });
supplierSchema.index({ 'performance.rating': 1, isActive: 1 });
supplierSchema.index({ isPreferred: 1, isActive: 1 });

// Virtual for full contact name
supplierSchema.virtual('contactPerson.fullName').get(function() {
  return `${this.contactPerson.firstName} ${this.contactPerson.lastName}`;
});

// Virtual for delivery performance percentage
supplierSchema.virtual('performance.deliveryPercentage').get(function() {
  if (this.performance.totalOrders === 0) return 0;
  return Math.round((this.performance.onTimeDeliveries / this.performance.totalOrders) * 100);
});

// Virtual for full address
supplierSchema.virtual('address.full').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Pre-save middleware to generate supplier code if not provided
supplierSchema.pre('save', function(next) {
  if (!this.supplierCode) {
    // Generate supplier code from name (first 3 letters + random number)
    const namePrefix = this.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    this.supplierCode = `${namePrefix}${randomSuffix}`;
  }
  next();
});

// Static method to find suppliers by category
supplierSchema.statics.findByCategory = function(category) {
  return this.find({
    categories: category,
    isActive: true
  }).sort({ 'performance.rating': -1 });
};

// Static method to find preferred suppliers
supplierSchema.statics.findPreferred = function() {
  return this.find({
    isPreferred: true,
    isActive: true
  }).sort({ 'performance.rating': -1 });
};

// Static method to find suppliers needing audit
supplierSchema.statics.findNeedingAudit = function() {
  const today = new Date();
  return this.find({
    $or: [
      { nextAuditDate: { $lte: today } },
      { nextAuditDate: { $exists: false } },
      { lastAuditDate: { $exists: false } }
    ],
    isActive: true
  });
};

// Instance method to calculate overall score
supplierSchema.methods.calculateOverallScore = function() {
  const ratingWeight = 0.4;
  const deliveryWeight = 0.3;
  const qualityWeight = 0.3;
  
  const deliveryScore = this.performance.deliveryPercentage / 20; // Convert percentage to 1-5 scale
  
  return Math.round(
    (this.performance.rating * ratingWeight) +
    (deliveryScore * deliveryWeight) +
    (this.performance.qualityScore * qualityWeight)
  );
};

// Instance method to update performance metrics
supplierSchema.methods.updatePerformance = function(orderData) {
  this.performance.totalOrders += 1;
  
  if (orderData.onTime) {
    this.performance.onTimeDeliveries += 1;
  }
  
  if (orderData.qualityRating) {
    // Update quality score as running average
    const currentTotal = this.performance.qualityScore * (this.performance.totalOrders - 1);
    this.performance.qualityScore = (currentTotal + orderData.qualityRating) / this.performance.totalOrders;
  }
  
  // Update overall rating based on performance
  this.performance.rating = this.calculateOverallScore();
  
  return this.save();
};

module.exports = mongoose.model('Supplier', supplierSchema);
