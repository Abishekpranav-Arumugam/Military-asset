const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('baseId');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Base access control
const authorizeBaseAccess = (req, res, next) => {
  const { baseId } = req.params;
  const user = req.user;

  if (user.role === 'admin') {
    return next();
  }

  if ((user.role === 'base_commander' || user.role === 'logistics_officer') && 
      user.baseId && user.baseId._id.toString() === baseId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Access denied. You can only access your assigned base.' 
  });
};

// Audit logging middleware (Corrected)
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // This logic runs after the controller method has finished
    // by intercepting the `res.send` function.
    const originalSend = res.send;
    
    res.send = function(data) {
      // We only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        
        // --- THIS IS THE KEY CHANGE ---
        // Create a simple, human-readable string for the audit details.
        let detailsString = `Performed ${req.method} on endpoint ${req.originalUrl}.`;
        
        // Add info about the request body for non-GET requests to provide context.
        if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            detailsString += ` Payload keys: ${Object.keys(req.body).join(', ')}.`;
        }
        
        const auditData = {
          userId: req.user._id,
          action,
          resource,
          // Get resourceId from URL parameters, or from the response body as a fallback.
          resourceId: req.params.id || JSON.parse(data)?.asset?._id || JSON.parse(data)?.user?._id || req.body._id,
          details: detailsString, // Use the new, clean string
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          baseId: req.user.baseId?._id || req.body.baseId || req.params.baseId
        };

        // Create the log entry. We use .catch() to prevent logging failures from crashing the app.
        AuditLog.create(auditData).catch(err => {
          logger.error('Audit log creation failed:', err);
        });
      }
      
      // Call the original res.send to complete the HTTP response cycle.
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeBaseAccess,
  auditLog
};