const { body, validationResult } = require('express-validator');

/**
 * Central validation error handler
 * Catches validation errors and returns 400 with error messages
 * All validation chains end with this middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Always return JSON for API requests
    return res.status(400).json({
      success: false,
      message: errors
        .array()
        .map((e) => e.msg)
        .join(', '),
      errors: errors.array(), // Include field-level errors for better frontend feedback
    });
  }
  next();
};

/**
 * VALIDATION CHAINS FOR TRAVEL ITEMS
 *
 * Each travel item type has a dedicated validation chain that:
 * 1. Validates required fields are present and non-empty
 * 2. Validates date/time formats where applicable
 * 3. Handles field name variations (e.g., 'name' OR 'hotelName' for hotels)
 * 4. Returns helpful error messages for frontend display
 *
 * All chains end with handleValidationErrors middleware which sends 400 status if validation fails
 *
 * FIELD NAME VARIATIONS (Handled by validators):
 * - Hotel: Accepts both 'name' and 'hotelName' (frontend sends 'name', backend stores as 'hotelName')
 * - Transportation: Accepts both 'method' and 'type' (frontend sends 'method', backend stores as 'type')
 */

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

  validateFlight: [
    // Required fields
    body('flightNumber').notEmpty().trim().withMessage('Flight number is required'),
    body('origin').notEmpty().trim().withMessage('Origin is required'),
    body('destination').notEmpty().trim().withMessage('Destination is required'),

    // DateTime fields - frontend sends separate date/time, backend combines
    body('departureDate').notEmpty().withMessage('Departure date is required'),
    body('departureTime').notEmpty().withMessage('Departure time is required'),
    body('arrivalDate').notEmpty().withMessage('Arrival date is required'),
    body('arrivalTime').notEmpty().withMessage('Arrival time is required'),

    // Optional fields
    body('airline').optional().trim(),
    body('confirmationNumber').optional().trim(),
    body('seatNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateHotel: [
    // Hotel name validation (handles both 'name' from frontend and 'hotelName' from backend)
    // Frontend sends 'name', but accepts either for backward compatibility
    body('name')
      .optional()
      .trim()
      .custom((value, { req }) => {
        const hotelName = value || req.body.hotelName;
        if (!hotelName || hotelName.trim() === '') {
          throw new Error('Hotel name is required');
        }
        return true;
      }),
    body('hotelName')
      .optional()
      .trim()
      .custom((value, { req }) => {
        const name = value || req.body.name;
        if (!name || name.trim() === '') {
          throw new Error('Hotel name is required');
        }
        return true;
      }),

    // Required location info
    body('address').notEmpty().trim().withMessage('Address is required'),

    // DateTime fields - frontend sends separate date/time, backend combines
    body('checkInDate').notEmpty().withMessage('Check-in date is required'),
    body('checkOutDate').notEmpty().withMessage('Check-out date is required'),

    // Optional fields
    body('phone').optional().trim(),
    body('checkInTime').optional().trim(),
    body('checkOutTime').optional().trim(),
    body('confirmationNumber').optional().trim(),
    body('roomNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateEvent: [
    // Required fields
    body('name').notEmpty().trim().withMessage('Event name is required'),
    body('location').notEmpty().trim().withMessage('Location is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),

    // Optional DateTime fields
    body('startTime').optional().trim(),
    body('endDate').optional().trim(),
    body('endTime').optional().trim(),

    // Optional contact info
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail().normalizeEmail().withMessage('Invalid contact email'),
    body('description').optional().trim(),
    handleValidationErrors,
  ],

  validateTransportation: [
    // Transportation method validation (handles both 'method' from frontend and 'type' from backend)
    // Frontend sends 'method', but accepts either for backward compatibility
    body('method')
      .optional()
      .trim()
      .custom((value, { req }) => {
        const type = value || req.body.type;
        if (!type || type.trim() === '') {
          throw new Error('Transportation method is required');
        }
        return true;
      }),
    body('type')
      .optional()
      .trim()
      .custom((value, { req }) => {
        const method = value || req.body.method;
        if (!method || method.trim() === '') {
          throw new Error('Transportation method is required');
        }
        return true;
      }),

    // Required location info
    body('origin').notEmpty().trim().withMessage('Origin is required'),
    body('destination').notEmpty().trim().withMessage('Destination is required'),

    // DateTime fields - frontend sends separate date/time, backend combines
    body('departureDate').notEmpty().withMessage('Departure date is required'),
    body('arrivalDate').notEmpty().withMessage('Arrival date is required'),

    // Optional fields
    body('departureTime').optional().trim(),
    body('arrivalTime').optional().trim(),
    body('provider').optional().trim(),
    body('confirmationNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateCarRental: [
    // Required rental info
    body('company').notEmpty().trim().withMessage('Company is required'),
    body('pickupLocation').notEmpty().trim().withMessage('Pickup location is required'),
    body('dropoffLocation').notEmpty().trim().withMessage('Dropoff location is required'),

    // DateTime fields - frontend sends separate date/time, backend combines
    body('pickupDate').notEmpty().withMessage('Pickup date is required'),
    body('dropoffDate').notEmpty().withMessage('Dropoff date is required'),

    // Optional fields
    body('pickupTime').optional().trim(),
    body('dropoffTime').optional().trim(),
    body('vehicleType').optional().trim(),
    body('confirmationNumber').optional().trim(),
    handleValidationErrors,
  ],
};

/**
 * VALIDATION USAGE IN ROUTES
 *
 * Import validation chains in route files:
 *   const { validateFlight, validateHotel, validateEvent, ... } = require('../middleware/validation');
 *
 * Apply to POST/PUT routes:
 *   router.post('/flights', validateFlight, flightController.createFlight);
 *   router.put('/flights/:id', validateFlight, flightController.updateFlight);
 *
 * All chains automatically handle validation errors and return 400 JSON on failure.
 *
 * FRONTEND INTEGRATION
 *
 * When backend returns validation errors (400 status), the response includes:
 * {
 *   success: false,
 *   message: "comma, separated, error messages",
 *   errors: [
 *     { param: 'fieldName', msg: 'Error message', ... }
 *   ]
 * }
 *
 * Frontend should display these errors alongside form fields.
 */
