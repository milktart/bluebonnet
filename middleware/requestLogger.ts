/**
 * Request Logger Middleware
 * Logs all HTTP requests with timing and user context
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Configuration
const SLOW_REQUEST_THRESHOLD = parseInt(process.env.SLOW_REQUEST_THRESHOLD || '3000', 10);

/**
 * Request logging middleware
 * Logs all HTTP requests with response time and status code
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for static assets, health checks, and common browser-requested assets
  const skipPaths = [
    '/css/',
    '/js/',
    '/images/',
    '/dist/',
    '/health',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/robots.txt',
    '/sitemap.xml',
  ];

  if (
    skipPaths.some((path) =>
      path.endsWith('/') ? req.path.startsWith(path) : req.path === path
    )
  ) {
    return next();
  }

  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to log when response completes
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;

    // Determine log level based on status code
    const { statusCode } = res;
    let logLevel: 'info' | 'warn' | 'error' = 'info';

    if (statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    }

    // Build log context
    const logContext: any = {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: (req.user as any)?.id,
      ip: req.ip || (req.connection as any).remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Add query params for GET requests (excluding sensitive data)
    if (req.method === 'GET' && Object.keys(req.query).length > 0) {
      logContext.query = req.query;
    }

    // Log slow requests as warnings
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn('Slow request detected', logContext);
    } else {
      logger[logLevel]('Request completed', logContext);
    }

    // Call original end function with all arguments
    return originalEnd.apply(res, args);
  } as any;

  next();
};

export default requestLogger;
