const logger = require('../config/logger');

/**
 * Base Controller Class
 * Provides common functionality for all controllers
 */
class BaseController {
  /**
   * Handle errors consistently across controllers
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   * @param {string} message - Custom error message
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  handleError(res, error, message = 'An error occurred', statusCode = 500) {
    logger.error(`${message}:`, error);
    
    // Don't expose internal error details in production
    const errorResponse = {
      message,
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    };
    
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Handle validation errors
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors array
   */
  handleValidationError(res, errors) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  /**
   * Handle not found errors
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   */
  handleNotFound(res, resource = 'Resource') {
    return res.status(404).json({
      message: `${resource} not found`
    });
  }

  /**
   * Handle unauthorized access
   * @param {Object} res - Express response object
   * @param {string} message - Custom message
   */
  handleUnauthorized(res, message = 'Access denied') {
    return res.status(403).json({ message });
  }

  /**
   * Send success response with data
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({
      message,
      data
    });
  }

  /**
   * Apply base filtering for non-admin users
   * @param {Object} query - MongoDB query object
   * @param {Object} user - User object from request
   */
  applyBaseFilter(query, user) {
    if (user.role !== 'admin' && user.baseId) {
      query.baseId = user.baseId;
    }
    return query;
  }

  /**
   * Parse pagination parameters
   * @param {Object} queryParams - Request query parameters
   * @returns {Object} Pagination object with page, limit, skip
   */
  parsePagination(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 20));
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
  }

  /**
   * Build date range query
   * @param {string} startDate - Start date string
   * @param {string} endDate - End date string
   * @returns {Object} Date range query object
   */
  buildDateRangeQuery(startDate, endDate) {
    const dateQuery = {};
    
    if (startDate) {
      dateQuery.$gte = new Date(startDate);
    }
    
    if (endDate) {
      dateQuery.$lte = new Date(endDate);
    }
    
    return Object.keys(dateQuery).length > 0 ? dateQuery : null;
  }
}

module.exports = BaseController;
