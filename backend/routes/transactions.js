const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const {
  createPurchase,
  createTransfer,
  createAssignment,
  createExpenditure,
  getTransactions
} = require('../controllers/transactionController');

const router = express.Router();

// Validation rules
const purchaseValidation = [
  body('assetId').isMongoId().withMessage('Valid asset ID is required'),
  body('baseId').isMongoId().withMessage('Valid base ID is required'),
  body('quantity').isNumeric().isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('unitPrice').isNumeric().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('vendorName').notEmpty().trim().withMessage('Vendor name is required'),
  body('vendorContact').optional().trim(),
  body('purchaseOrderNumber').optional().trim(),
  body('invoiceNumber').optional().trim(),
  body('description').optional().trim(),
  body('remarks').optional().trim()
];

const transferValidation = [
  body('assetId').isMongoId().withMessage('Valid asset ID is required'),
  body('fromBaseId').isMongoId().withMessage('Valid from base ID is required'),
  body('toBaseId').isMongoId().withMessage('Valid to base ID is required'),
  body('quantity').isNumeric().isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('description').optional().trim(),
  body('remarks').optional().trim()
];

const assignmentValidation = [
  body('assetId').isMongoId().withMessage('Valid asset ID is required'),
  body('baseId').isMongoId().withMessage('Valid base ID is required'),
  body('quantity').isNumeric().isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('assignedTo.personnelName').notEmpty().trim().withMessage('Personnel name is required'),
  body('assignedTo.rank').notEmpty().trim().withMessage('Rank is required'),
  body('description').optional().trim(),
  body('remarks').optional().trim()
];

const expenditureValidation = [
  body('assetId').isMongoId().withMessage('Valid asset ID is required'),
  body('baseId').isMongoId().withMessage('Valid base ID is required'),
  body('quantity').isNumeric().isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('description').optional().trim(),
  body('remarks').optional().trim()
];

// Routes
router.post('/purchase', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  purchaseValidation,
  auditLog('purchase', 'transaction'),
  createPurchase
);

router.post('/transfer', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  transferValidation,
  auditLog('transfer', 'transaction'),
  createTransfer
);

router.post('/assignment', 
  authenticate, 
  authorize('admin', 'base_commander'),
  assignmentValidation,
  auditLog('assignment', 'transaction'),
  createAssignment
);

router.post('/expenditure', 
  authenticate, 
  authorize('admin', 'base_commander'),
  expenditureValidation,
  auditLog('expenditure', 'transaction'),
  createExpenditure
);

router.get('/', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'transaction'),
  getTransactions
);

module.exports = router;
