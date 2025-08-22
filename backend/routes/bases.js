const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize, auditLog } = require('../middleware/auth');
const {
  getBases,
  getBaseById,
  createBase,
  updateBase,
  deleteBase
} = require('../controllers/baseController');

const router = express.Router();

// Validation rules
const baseValidation = [
  body('name').notEmpty().trim(),
  body('code').notEmpty().trim().isLength({ min: 2, max: 10 }),
  body('location.address').notEmpty().trim(),
  body('location.city').notEmpty().trim(),
  body('location.state').notEmpty().trim(),
  body('location.country').notEmpty().trim()
];

// Routes
router.get('/', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'base'),
  getBases
);

router.get('/:id', 
  authenticate, 
  authorize('admin', 'base_commander', 'logistics_officer'),
  auditLog('view', 'base'),
  getBaseById
);

router.post('/', 
  authenticate, 
  authorize('admin'),
  baseValidation,
  auditLog('create', 'base'),
  createBase
);

router.put('/:id', 
  authenticate, 
  authorize('admin'),
  baseValidation,
  auditLog('update', 'base'),
  updateBase
);

router.delete('/:id', 
  authenticate, 
  authorize('admin'),
  auditLog('delete', 'base'),
  deleteBase
);

module.exports = router;
