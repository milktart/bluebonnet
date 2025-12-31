/**
 * Error Handler Middleware
 * Provides consistent error handling across the application
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom Application Error class
 * Operational errors that should be handled gracefully
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not Found Error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict Error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Error Handler Middleware
 * Handles all errors in the application
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Set defaults
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Common browser-requested assets that result in expected 404s
  const commonMissingAssets = [
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/robots.txt',
    '/sitemap.xml',
  ];

  // Skip logging common, expected 404s
  const isCommon404 = err.statusCode === 404 && commonMissingAssets.includes(req.path);

  // Log error with context (skip common 404s)
  if (!isCommon404) {
    const errorContext = {
      error: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: (req.user as any)?.id,
      isOperational: err.isOperational,
    };

    if (err.statusCode >= 500) {
      logger.error('Server error occurred:', errorContext);
    } else {
      logger.warn('Client error occurred:', errorContext);
    }
  }

  // Check if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine if we should show detailed errors
  const showDetails = process.env.NODE_ENV !== 'production' || err.isOperational;

  // Handle specific error types (Sequelize errors)
  if (err.name === 'SequelizeValidationError') {
    err.statusCode = 400;
    err.message = (err.errors as any[]).map((e: any) => e.message).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    err.statusCode = 409;
    err.message = 'A record with this value already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    err.statusCode = 400;
    err.message = 'Invalid reference to related record';
  }

  // Check if this is an AJAX/API request
  const isAjax = req.xhr || req.headers['x-async-request'] === 'true';
  const isApiRequest = req.path.startsWith('/api/');

  if (isAjax || isApiRequest) {
    // Return JSON for AJAX/API requests
    return res.status(err.statusCode).json({
      success: false,
      error: showDetails ? err.message : 'An error occurred',
      ...(showDetails && { stack: err.stack }),
    });
  }

  // For non-API requests, return JSON instead of rendering (EJS views no longer exist)
  if (!err.isOperational && process.env.NODE_ENV === 'production') {
    // Don't leak error details in production for non-operational errors
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again later.',
      status: 500,
    });
  }

  // Return JSON error response (EJS views are deprecated)
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    status: err.statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError('Page');
  next(error);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
