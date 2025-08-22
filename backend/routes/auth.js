const express = require('express');
const { body } = require('express-validator');
const { authenticate, auditLog } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('rank').notEmpty().trim(),
  body('role').isIn(['admin', 'base_commander', 'logistics_officer'])
];

const loginValidation = [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticate, auditLog('view', 'user'), getProfile);
router.post('/logout', authenticate, auditLog('logout', 'user'), logout);

module.exports = router;
