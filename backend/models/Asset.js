const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment', 'supplies'],
    required: true
  },
  subcategory: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String
  },
  unitOfMeasure: {
    type: String,
    required: true,
    enum: ['piece', 'unit', 'kg', 'liter', 'box', 'crate']
  },
  isConsumable: {
    type: Boolean,
    default: false
  },
  minimumStockLevel: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
