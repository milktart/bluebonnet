/**
 * Authentication Middleware
 * Handles session-based authentication with Passport.js
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Ensure user is authenticated
 * Redirects to login if not authenticated
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  (req as any).session.returnTo = req.originalUrl;
  (req as any).flash('error_msg', 'Please log in to view this resource');
  res.redirect('/auth/login');
}

/**
 * Ensure user is NOT authenticated
 * Redirects to home if already logged in
 */
export function forwardAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');
}

/**
 * Check if user is authenticated
 * Used for conditional rendering and redirects
 */
export function isAuthenticated(req: Request): boolean {
  return req.isAuthenticated ? req.isAuthenticated() : false;
}

export default {
  ensureAuthenticated,
  forwardAuthenticated,
  isAuthenticated,
};
