const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
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

module.exports = {
  validateRegistration: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
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
    handleValidationErrors,
  ],

  validateLogin: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],

  validateTrip: [
    body('name').notEmpty().trim().withMessage('Trip name is required'),
    body('departureDate').custom((value) => {
      // Handle ISO format "YYYY-MM-DD" from HTML date input
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        throw new Error('Valid departure date is required');
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
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
      if (isNaN(date.getTime())) {
        throw new Error('Valid return date is required');
      }
      return true;
    }),
    body('purpose').isIn(['business', 'pleasure', 'other']).withMessage('Invalid purpose'),
    handleValidationErrors,
  ],

  validateProfileUpdate: [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 1 })
      .withMessage('Last initial must be exactly one character'),
    handleValidationErrors,
  ],

  validatePasswordChange: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    }),
    handleValidationErrors,
  ],
};
