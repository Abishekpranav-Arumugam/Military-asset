const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} = require('../controllers/assetController');

const router = express.Router();

// Validation rules
const assetValidation = [
  body('name').notEmpty().trim(),
  body('category').isIn(['vehicle', 'weapon', 'ammunition', 'equipment', 'supplies']),
  body('subcategory').notEmpty().trim(),
  body('unitOfMeasure').isIn(['piece', 'unit', 'kg', 'liter', 'box', 'crate'])
];

// Routes
router.get('/', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'asset'),
  getAssets
);

router.get('/:id', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'asset'),
  getAssetById
);

router.post('/', 
  authenticate, 
  authorize('admin'),
  assetValidation,
  auditLog('create', 'asset'),
  createAsset
);

router.put('/:id', 
  authenticate, 
  authorize('admin'),
  assetValidation,
  auditLog('update', 'asset'),
  updateAsset
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'),
  auditLog('delete', 'asset'),
  deleteAsset
);

module.exports = router;
