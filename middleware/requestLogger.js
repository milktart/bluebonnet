/**
 * Request Logger Middleware
 * Phase 3 - Backend Architecture: Middleware Enhancements
 *
 * Logs all HTTP requests with timing and user context
 */

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all HTTP requests with response time and status code
 */
const requestLogger = (req, res, next) => {
  // Skip logging for static assets and health checks
  if (
    req.path.startsWith('/css/') ||
    req.path.startsWith('/js/') ||
    req.path.startsWith('/images/') ||
    req.path.startsWith('/dist/') ||
    req.path === '/health' ||
    req.path === '/favicon.ico'
  ) {
    return next();
  }

  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to log when response completes
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Determine log level based on status code
    const { statusCode } = res;
    let logLevel = 'info';

    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // Build log context
    const logContext = {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Add query params for GET requests (excluding sensitive data)
    if (req.method === 'GET' && Object.keys(req.query).length > 0) {
      logContext.query = req.query;
    }

    // Log slow requests as warnings
    if (duration > 3000) {
      logger.warn('Slow request detected', logContext);
    } else {
      logger[logLevel]('Request completed', logContext);
    }

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = requestLogger;
