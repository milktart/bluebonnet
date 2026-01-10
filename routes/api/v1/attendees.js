/**
 * API v1 Attendees Routes
 * RESTful JSON API for trip attendee management
 */

const express = require('express');
const { body } = require('express-validator');
const attendeeController = require('../../../controllers/attendeeController');
const { ensureAuthenticated } = require('../../../middleware/auth');
const {
  requireTripViewAccess,
  requireTripAdmin,
  requireTripOwnership,
} = require('../../../middleware/authorization');

const router = express.Router();

// All attendee routes require authentication
router.use(ensureAuthenticated);

// Validation middleware
const addAttendeeValidation = [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim().isString(),
  body('firstName').optional().trim().isString(),
  body('lastName').optional().trim().isString(),
  body('role').optional().isIn(['owner', 'admin', 'attendee']),
];

const updateRoleValidation = [body('role').isIn(['owner', 'admin', 'attendee'])];

/**
 * GET /api/v1/trips/:tripId/attendees
 * Get all attendees for a trip
 * Authorization: Trip owner, admin, or attendee
 */
router.get('/trips/:tripId/attendees', requireTripViewAccess, attendeeController.getTripAttendees);

/**
 * POST /api/v1/trips/:tripId/attendees
 * Add attendee to trip
 * Authorization: Trip owner or admin only
 */
router.post(
  '/trips/:tripId/attendees',
  requireTripAdmin,
  addAttendeeValidation,
  attendeeController.addTripAttendee
);

/**
 * PUT /api/v1/trips/:tripId/attendees/:attendeeId
 * Update attendee role
 * Authorization: Trip owner only
 */
router.put(
  '/trips/:tripId/attendees/:attendeeId',
  requireTripOwnership,
  updateRoleValidation,
  attendeeController.updateAttendeeRole
);

/**
 * DELETE /api/v1/trips/:tripId/attendees/:attendeeId
 * Remove attendee from trip
 * Authorization: Trip owner or admin only
 */
router.delete(
  '/trips/:tripId/attendees/:attendeeId',
  requireTripAdmin,
  attendeeController.removeTripAttendee
);

module.exports = router;
