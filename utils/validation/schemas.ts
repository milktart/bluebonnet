/**
 * Validation Schemas for Express Validator
 *
 * Reusable validation rule sets for all API endpoints
 * Single source of truth for input validation
 *
 * Usage with express-validator:
 * import { flightValidation } from '../utils/validation/schemas';
 * router.post('/', flightValidation.create, handler);
 *
 * Or programmatically:
 * import { body, validationResult } from 'express-validator';
 * import { flightValidation } from '../utils/validation/schemas';
 *
 * router.post('/', flightValidation.create, (req, res) => {
 *   const errors = validationResult(req);
 *   if (!errors.isEmpty()) {
 *     return res.status(400).json({ errors: errors.array() });
 *   }
 *   // ... handle valid data
 * });
 *
 * Last Updated: December 30, 2025
 * Version: 1.0.0
 */

import { body, param, query } from 'express-validator';

/**
 * TRIP VALIDATION SCHEMAS
 */

export const tripValidation = {
  /**
   * Create trip validation
   * POST /api/v1/trips
   */
  create: [
    body('name')
      .notEmpty()
      .withMessage('Trip name is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Trip name must be between 1 and 255 characters'),

    body('departureDate')
      .notEmpty()
      .withMessage('Departure date is required')
      .isISO8601()
      .withMessage('Departure date must be a valid ISO 8601 date'),

    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Return date must be a valid ISO 8601 date'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),

    body('purpose')
      .optional()
      .isIn(['leisure', 'business', 'adventure', 'family', 'romantic', 'other'])
      .withMessage(
        'Purpose must be one of: leisure, business, adventure, family, romantic, other'
      ),

    body('defaultCompanionEditPermission')
      .optional()
      .isBoolean()
      .withMessage('defaultCompanionEditPermission must be a boolean'),
  ],

  /**
   * Update trip validation
   * PUT /api/v1/trips/:id
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Trip ID must be a valid UUID'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Trip name must be between 1 and 255 characters'),

    body('departureDate')
      .optional()
      .isISO8601()
      .withMessage('Departure date must be a valid ISO 8601 date'),

    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Return date must be a valid ISO 8601 date'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),

    body('purpose')
      .optional()
      .isIn(['leisure', 'business', 'adventure', 'family', 'romantic', 'other'])
      .withMessage(
        'Purpose must be one of: leisure, business, adventure, family, romantic, other'
      ),
  ],

  /**
   * Get trip validation
   * GET /api/v1/trips/:id
   */
  getOne: [
    param('id')
      .isUUID()
      .withMessage('Trip ID must be a valid UUID'),
  ],

  /**
   * Delete trip validation
   * DELETE /api/v1/trips/:id
   */
  delete: [
    param('id')
      .isUUID()
      .withMessage('Trip ID must be a valid UUID'),
  ],
};

/**
 * FLIGHT VALIDATION SCHEMAS
 */

export const flightValidation = {
  /**
   * Create flight validation
   * POST /api/v1/flights
   * POST /api/v1/trips/:tripId/flights
   */
  create: [
    body('flightNumber')
      .notEmpty()
      .withMessage('Flight number is required')
      .trim()
      .matches(/^[A-Z]{1,3}\d{1,5}$/)
      .withMessage('Flight number must be valid (e.g., AA123, BA1234)'),

    body('airline')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Airline name must not exceed 100 characters'),

    body('origin')
      .notEmpty()
      .withMessage('Origin is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Origin must be between 1 and 100 characters'),

    body('destination')
      .notEmpty()
      .withMessage('Destination is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Destination must be between 1 and 100 characters'),

    body('departureDateTime')
      .optional()
      .isISO8601()
      .withMessage('Departure date/time must be ISO 8601 format'),

    body('departureDate')
      .optional()
      .isISO8601()
      .withMessage('Departure date must be ISO 8601 format'),

    body('departureTime')
      .optional()
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Departure time must be HH:mm format'),

    body('arrivalDateTime')
      .optional()
      .isISO8601()
      .withMessage('Arrival date/time must be ISO 8601 format'),

    body('arrivalDate')
      .optional()
      .isISO8601()
      .withMessage('Arrival date must be ISO 8601 format'),

    body('arrivalTime')
      .optional()
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Arrival time must be HH:mm format'),

    body('originTimezone')
      .optional()
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Origin timezone must be a valid IANA timezone'),

    body('destinationTimezone')
      .optional()
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Destination timezone must be a valid IANA timezone'),

    body('pnr')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('PNR must not exceed 50 characters'),

    body('seat')
      .optional()
      .trim()
      .isLength({ max: 10 })
      .withMessage('Seat must not exceed 10 characters'),
  ],

  /**
   * Update flight validation
   * PUT /api/v1/flights/:id
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Flight ID must be a valid UUID'),

    body('flightNumber')
      .optional()
      .trim()
      .matches(/^[A-Z]{1,3}\d{1,5}$/)
      .withMessage('Flight number must be valid'),

    body('origin')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Origin must be between 1 and 100 characters'),

    body('destination')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Destination must be between 1 and 100 characters'),

    body('departureDateTime')
      .optional()
      .isISO8601()
      .withMessage('Departure date/time must be ISO 8601 format'),

    body('arrivalDateTime')
      .optional()
      .isISO8601()
      .withMessage('Arrival date/time must be ISO 8601 format'),
  ],

  /**
   * Get flight validation
   * GET /api/v1/flights/:id
   */
  getOne: [
    param('id')
      .isUUID()
      .withMessage('Flight ID must be a valid UUID'),
  ],

  /**
   * Delete flight validation
   * DELETE /api/v1/flights/:id
   */
  delete: [
    param('id')
      .isUUID()
      .withMessage('Flight ID must be a valid UUID'),
  ],
};

/**
 * HOTEL VALIDATION SCHEMAS
 */

export const hotelValidation = {
  /**
   * Create hotel validation
   */
  create: [
    body('name')
      .notEmpty()
      .withMessage('Hotel name is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Hotel name must be between 1 and 255 characters'),

    body('address')
      .notEmpty()
      .withMessage('Hotel address is required')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Address must be between 1 and 500 characters'),

    body('city')
      .notEmpty()
      .withMessage('City is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City must be between 1 and 100 characters'),

    body('checkInDateTime')
      .notEmpty()
      .withMessage('Check-in date/time is required')
      .isISO8601()
      .withMessage('Check-in must be ISO 8601 format'),

    body('checkOutDateTime')
      .notEmpty()
      .withMessage('Check-out date/time is required')
      .isISO8601()
      .withMessage('Check-out must be ISO 8601 format'),

    body('timezone')
      .notEmpty()
      .withMessage('Timezone is required')
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Timezone must be a valid IANA timezone'),

    body('rate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rate must be a positive number'),

    body('currency')
      .optional()
      .matches(/^[A-Z]{3}$/)
      .withMessage('Currency must be a 3-letter ISO code'),

    body('numberOfRooms')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Number of rooms must be a positive integer'),

    body('numberOfGuests')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Number of guests must be a positive integer'),
  ],

  /**
   * Update hotel validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Hotel ID must be a valid UUID'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Hotel name must be between 1 and 255 characters'),

    body('checkInDateTime')
      .optional()
      .isISO8601()
      .withMessage('Check-in must be ISO 8601 format'),

    body('checkOutDateTime')
      .optional()
      .isISO8601()
      .withMessage('Check-out must be ISO 8601 format'),
  ],
};

/**
 * EVENT VALIDATION SCHEMAS
 */

export const eventValidation = {
  /**
   * Create event validation
   */
  create: [
    body('name')
      .notEmpty()
      .withMessage('Event name is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Event name must be between 1 and 255 characters'),

    body('startDateTime')
      .notEmpty()
      .withMessage('Start date/time is required')
      .isISO8601()
      .withMessage('Start date/time must be ISO 8601 format'),

    body('endDateTime')
      .optional()
      .isISO8601()
      .withMessage('End date/time must be ISO 8601 format'),

    body('location')
      .notEmpty()
      .withMessage('Location is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Location must be between 1 and 255 characters'),

    body('timezone')
      .notEmpty()
      .withMessage('Timezone is required')
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Timezone must be a valid IANA timezone'),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),

    body('cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),

    body('currency')
      .optional()
      .matches(/^[A-Z]{3}$/)
      .withMessage('Currency must be a 3-letter ISO code'),
  ],

  /**
   * Update event validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Event ID must be a valid UUID'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Event name must be between 1 and 255 characters'),

    body('startDateTime')
      .optional()
      .isISO8601()
      .withMessage('Start date/time must be ISO 8601 format'),

    body('endDateTime')
      .optional()
      .isISO8601()
      .withMessage('End date/time must be ISO 8601 format'),
  ],
};

/**
 * CAR RENTAL VALIDATION SCHEMAS
 */

export const carRentalValidation = {
  /**
   * Create car rental validation
   */
  create: [
    body('vendor')
      .notEmpty()
      .withMessage('Vendor/company is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Vendor name must be between 1 and 100 characters'),

    body('vehicleType')
      .notEmpty()
      .withMessage('Vehicle type is required')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Vehicle type must be between 1 and 100 characters'),

    body('pickupLocation')
      .notEmpty()
      .withMessage('Pickup location is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Pickup location must be between 1 and 255 characters'),

    body('dropoffLocation')
      .notEmpty()
      .withMessage('Dropoff location is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Dropoff location must be between 1 and 255 characters'),

    body('pickupDateTime')
      .notEmpty()
      .withMessage('Pickup date/time is required')
      .isISO8601()
      .withMessage('Pickup date/time must be ISO 8601 format'),

    body('dropoffDateTime')
      .notEmpty()
      .withMessage('Dropoff date/time is required')
      .isISO8601()
      .withMessage('Dropoff date/time must be ISO 8601 format'),

    body('pickupTimezone')
      .notEmpty()
      .withMessage('Pickup timezone is required')
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Timezone must be a valid IANA timezone'),

    body('cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),

    body('currency')
      .optional()
      .matches(/^[A-Z]{3}$/)
      .withMessage('Currency must be a 3-letter ISO code'),
  ],

  /**
   * Update car rental validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Car rental ID must be a valid UUID'),

    body('pickupDateTime')
      .optional()
      .isISO8601()
      .withMessage('Pickup date/time must be ISO 8601 format'),

    body('dropoffDateTime')
      .optional()
      .isISO8601()
      .withMessage('Dropoff date/time must be ISO 8601 format'),
  ],
};

/**
 * TRANSPORTATION VALIDATION SCHEMAS
 */

export const transportationValidation = {
  /**
   * Create transportation validation
   */
  create: [
    body('method')
      .notEmpty()
      .withMessage('Transportation method is required')
      .isIn(['taxi', 'shuttle', 'train', 'bus', 'car', 'bike', 'walk', 'other'])
      .withMessage(
        'Method must be one of: taxi, shuttle, train, bus, car, bike, walk, other'
      ),

    body('origin')
      .notEmpty()
      .withMessage('Origin is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Origin must be between 1 and 255 characters'),

    body('destination')
      .notEmpty()
      .withMessage('Destination is required')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Destination must be between 1 and 255 characters'),

    body('departureDateTime')
      .notEmpty()
      .withMessage('Departure date/time is required')
      .isISO8601()
      .withMessage('Departure date/time must be ISO 8601 format'),

    body('arrivalDateTime')
      .notEmpty()
      .withMessage('Arrival date/time is required')
      .isISO8601()
      .withMessage('Arrival date/time must be ISO 8601 format'),

    body('originTimezone')
      .notEmpty()
      .withMessage('Origin timezone is required')
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Timezone must be a valid IANA timezone'),

    body('destinationTimezone')
      .notEmpty()
      .withMessage('Destination timezone is required')
      .matches(/^[A-Za-z_/]+$/)
      .withMessage('Timezone must be a valid IANA timezone'),

    body('cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be a positive number'),

    body('currency')
      .optional()
      .matches(/^[A-Z]{3}$/)
      .withMessage('Currency must be a 3-letter ISO code'),
  ],

  /**
   * Update transportation validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Transportation ID must be a valid UUID'),

    body('method')
      .optional()
      .isIn(['taxi', 'shuttle', 'train', 'bus', 'car', 'bike', 'walk', 'other'])
      .withMessage('Method must be one of the valid options'),

    body('departureDateTime')
      .optional()
      .isISO8601()
      .withMessage('Departure date/time must be ISO 8601 format'),

    body('arrivalDateTime')
      .optional()
      .isISO8601()
      .withMessage('Arrival date/time must be ISO 8601 format'),
  ],
};

/**
 * COMPANION VALIDATION SCHEMAS
 */

export const companionValidation = {
  /**
   * Add companion validation
   */
  create: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Email must be valid'),

    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('First name must not exceed 100 characters'),

    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Last name must not exceed 100 characters'),
  ],

  /**
   * Update companion validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Companion ID must be a valid UUID'),

    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('First name must not exceed 100 characters'),

    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Last name must not exceed 100 characters'),
  ],
};

/**
 * VOUCHER VALIDATION SCHEMAS
 */

export const voucherValidation = {
  /**
   * Create voucher validation
   */
  create: [
    body('type')
      .notEmpty()
      .withMessage('Voucher type is required')
      .isIn(['upgrade', 'voucher', 'credit', 'discount', 'other'])
      .withMessage('Type must be one of: upgrade, voucher, credit, discount, other'),

    body('value')
      .notEmpty()
      .withMessage('Value is required')
      .isFloat({ min: 0 })
      .withMessage('Value must be a positive number'),

    body('currency')
      .notEmpty()
      .withMessage('Currency is required')
      .matches(/^[A-Z]{3}$/)
      .withMessage('Currency must be a 3-letter ISO code'),

    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be ISO 8601 format'),

    body('code')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Code must not exceed 100 characters'),
  ],

  /**
   * Update voucher validation
   */
  update: [
    param('id')
      .isUUID()
      .withMessage('Voucher ID must be a valid UUID'),

    body('value')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Value must be a positive number'),

    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be ISO 8601 format'),
  ],
};

/**
 * COMMON VALIDATION CHAINS
 * For endpoints that need multiple validations
 */

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const filterValidation = [
  query('filter')
    .optional()
    .isIn(['upcoming', 'past', 'all'])
    .withMessage('Filter must be one of: upcoming, past, all'),
];

/**
 * EXPORT SUMMARY
 *
 * Validation objects by entity type:
 * - tripValidation.create, update, getOne, delete
 * - flightValidation.create, update, getOne, delete
 * - hotelValidation.create, update
 * - eventValidation.create, update
 * - carRentalValidation.create, update
 * - transportationValidation.create, update
 * - companionValidation.create, update
 * - voucherValidation.create, update
 *
 * Common chains:
 * - paginationValidation
 * - filterValidation
 *
 * Usage in routes:
 * router.post('/', flightValidation.create, handler);
 * router.put('/:id', flightValidation.update, handler);
 */
