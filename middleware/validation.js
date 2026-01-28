const { body, validationResult } = require('express-validator');

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
    });
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
    body('flightNumber').notEmpty().trim().withMessage('Flight number is required'),
    body('airline').optional().trim(),
    body('origin').notEmpty().trim().withMessage('Origin is required'),
    body('destination').notEmpty().trim().withMessage('Destination is required'),
    body('departureDate').notEmpty().withMessage('Departure date is required'),
    body('departureTime').notEmpty().withMessage('Departure time is required'),
    body('arrivalDate').notEmpty().withMessage('Arrival date is required'),
    body('arrivalTime').notEmpty().withMessage('Arrival time is required'),
    body('confirmationNumber').optional().trim(),
    body('seatNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateHotel: [
    body('name')
      .optional()
      .trim()
      .custom((value, { req }) => {
        // Accept either 'name' or 'hotelName' field
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
        // Accept either 'name' or 'hotelName' field
        const name = value || req.body.name;
        if (!name || name.trim() === '') {
          throw new Error('Hotel name is required');
        }
        return true;
      }),
    body('address').notEmpty().trim().withMessage('Address is required'),
    body('phone').optional().trim(),
    body('checkInDate').notEmpty().withMessage('Check-in date is required'),
    body('checkInTime').optional().trim(),
    body('checkOutDate').notEmpty().withMessage('Check-out date is required'),
    body('checkOutTime').optional().trim(),
    body('confirmationNumber').optional().trim(),
    body('roomNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateEvent: [
    body('name').notEmpty().trim().withMessage('Event name is required'),
    body('location').notEmpty().trim().withMessage('Location is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('startTime').optional().trim(),
    body('endDate').optional().trim(),
    body('endTime').optional().trim(),
    body('contactPhone').optional().trim(),
    body('contactEmail').optional().isEmail().normalizeEmail().withMessage('Invalid contact email'),
    body('description').optional().trim(),
    handleValidationErrors,
  ],

  validateTransportation: [
    body('method')
      .optional()
      .trim()
      .custom((value, { req }) => {
        // Accept either 'method' or 'type' field
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
        // Accept either 'method' or 'type' field
        const method = value || req.body.method;
        if (!method || method.trim() === '') {
          throw new Error('Transportation method is required');
        }
        return true;
      }),
    body('origin').notEmpty().trim().withMessage('Origin is required'),
    body('destination').notEmpty().trim().withMessage('Destination is required'),
    body('departureDate').notEmpty().withMessage('Departure date is required'),
    body('departureTime').optional().trim(),
    body('arrivalDate').notEmpty().withMessage('Arrival date is required'),
    body('arrivalTime').optional().trim(),
    body('provider').optional().trim(),
    body('confirmationNumber').optional().trim(),
    handleValidationErrors,
  ],

  validateCarRental: [
    body('company').notEmpty().trim().withMessage('Company is required'),
    body('pickupLocation').notEmpty().trim().withMessage('Pickup location is required'),
    body('dropoffLocation').notEmpty().trim().withMessage('Dropoff location is required'),
    body('pickupDate').notEmpty().withMessage('Pickup date is required'),
    body('pickupTime').optional().trim(),
    body('dropoffDate').notEmpty().withMessage('Dropoff date is required'),
    body('dropoffTime').optional().trim(),
    body('vehicleType').optional().trim(),
    body('confirmationNumber').optional().trim(),
    handleValidationErrors,
  ],
};
