/**
 * Form Validation Middleware
 * Legacy express-validator middleware for EJS form submissions
 * New API validation uses Zod in validators/middleware.ts
 */

import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Handle validation errors
 * Flashes errors and redirects back
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    (req as any).flash(
      'error_msg',
      errors
        .array()
        .map((e) => e.msg)
        .join(', ')
    );
    return res.redirect('back');
  }
  next();
};

/**
 * Registration form validation
 */
export const validateRegistration: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== (req.body as any).password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 1 })
    .withMessage('Last initial must be exactly one character'),
  handleValidationErrors as any,
];

/**
 * Login form validation
 */
export const validateLogin: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors as any,
];

/**
 * Trip form validation
 */
export const validateTrip: ValidationChain[] = [
  body('name').notEmpty().trim().withMessage('Trip name is required'),
  body('departureDate').custom((value) => {
    // Handle ISO format "YYYY-MM-DD" from HTML date input
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new Error('Valid departure date is required');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Valid departure date is required');
    }
    return true;
  }),
  body('returnDate').custom((value) => {
    // Handle ISO format "YYYY-MM-DD" from HTML date input
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new Error('Valid return date is required');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Valid return date is required');
    }
    return true;
  }),
  body('purpose').isIn(['business', 'pleasure', 'other']).withMessage('Invalid purpose'),
  handleValidationErrors as any,
];

/**
 * Profile update validation
 */
export const validateProfileUpdate: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 1 })
    .withMessage('Last initial must be exactly one character'),
  handleValidationErrors as any,
];

/**
 * Password change validation
 */
export const validatePasswordChange: ValidationChain[] = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== (req.body as any).newPassword) {
      throw new Error('New passwords do not match');
    }
    return true;
  }),
  handleValidationErrors as any,
];

export default {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateTrip,
  validateProfileUpdate,
  validatePasswordChange,
};
