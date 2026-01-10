/**
 * API v1 Attendees Routes
 * RESTful JSON API for trip attendee management
 */

const express = require('express');
const { body } = require('express-validator');
const attendeeController = require('../../../controllers/attendeeController');
const { ensureAuthenticated } = require('../../../middleware/auth');

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
 */
router.get('/trips/:tripId/attendees', attendeeController.getTripAttendees);

/**
 * POST /api/v1/trips/:tripId/attendees
 * Add attendee to trip
 */
router.post('/trips/:tripId/attendees', addAttendeeValidation, attendeeController.addTripAttendee);

/**
 * PUT /api/v1/trips/:tripId/attendees/:attendeeId
 * Update attendee role
 */
router.put(
  '/trips/:tripId/attendees/:attendeeId',
  updateRoleValidation,
  attendeeController.updateAttendeeRole
);

/**
 * DELETE /api/v1/trips/:tripId/attendees/:attendeeId
 * Remove attendee from trip
 */
router.delete('/trips/:tripId/attendees/:attendeeId', attendeeController.removeTripAttendee);

module.exports = router;
