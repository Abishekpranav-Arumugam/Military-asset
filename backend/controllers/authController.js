const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, baseId, firstName, lastName, rank } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    const user = new User({
      username, email, password, role,
      baseId: role !== 'admin' ? baseId : undefined,
      firstName, lastName, rank
    });
    await user.save();

    const token = generateToken(user._id);

    // --- THIS IS THE CHANGE ---
    // Log registration with a clean string detail
    await AuditLog.create({
      userId: user._id,
      action: 'create',
      resource: 'user',
      resourceId: user._id,
      details: `New user '${user.username}' registered with role: ${role}.`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const user = await User.findOne({ $or: [{ email: username }, { username }] }).populate('baseId');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // --- THIS IS THE CHANGE ---
    // Log login with a clean string detail
    await AuditLog.create({
      userId: user._id,
      action: 'login',
      resource: 'user',
      resourceId: user._id,
      details: `User '${user.username}' logged in successfully.`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      baseId: user.baseId?._id
    });

    res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('baseId');
    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // --- THIS IS THE CHANGE ---
    // Log logout with a clean string detail
    await AuditLog.create({
      userId: req.user._id,
      action: 'logout',
      resource: 'user',
      resourceId: req.user._id,
      details: `User '${req.user.username}' logged out successfully.`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      baseId: req.user.baseId?._id
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};