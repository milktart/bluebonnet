/**
 * Attendee Controller
 * API endpoints for trip attendee management
 */

const { validationResult } = require('express-validator');
const AttendeeService = require('../services/attendeeService');
const { Trip } = require('../models');
const logger = require('../utils/logger');

const attendeeService = new AttendeeService();

/**
 * GET /api/trips/:tripId/attendees
 * Get all attendees for a trip
 */
exports.getTripAttendees = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    // Check access
    const access = await attendeeService.validateTripAccess(req.user.id, tripId);
    if (!access && trip.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const attendees = await attendeeService.getTripAttendees(tripId);

    res.json({ success: true, attendees });
  } catch (error) {
    logger.error('GET_TRIP_ATTENDEES_ERROR', { error: error.message });
    res.status(500).json({ success: false, error: 'Error fetching attendees' });
  }
};

/**
 * POST /api/trips/:tripId/attendees
 * Add attendee to trip
 */
exports.addTripAttendee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tripId } = req.params;
    const { email, firstName, lastName, name, role = 'attendee' } = req.body;

    // Verify trip exists and user is owner or admin
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.userId !== req.user.id) {
      const access = await attendeeService.validateTripAccess(req.user.id, tripId);
      if (!access || !access.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only trip owner or admin can add attendees',
        });
      }
    }

    const attendee = await attendeeService.addTripAttendee(
      tripId,
      { email, firstName, lastName, name },
      role
    );

    res.status(201).json({ success: true, attendee });
  } catch (error) {
    logger.error('ADD_TRIP_ATTENDEE_ERROR', { error: error.message });

    if (error.message.includes('already exists') || error.message.includes('already on trip')) {
      return res.status(409).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Error adding attendee' });
  }
};

/**
 * PUT /api/trips/:tripId/attendees/:attendeeId
 * Update attendee role
 */
exports.updateAttendeeRole = async (req, res) => {
  try {
    const { tripId, attendeeId } = req.params;
    const { role } = req.body;

    // Verify trip exists and user is owner or admin
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.userId !== req.user.id) {
      const access = await attendeeService.validateTripAccess(req.user.id, tripId);
      if (!access || !access.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only trip owner or admin can modify attendees',
        });
      }
    }

    const attendee = await attendeeService.updateAttendeeRole(tripId, attendeeId, role);

    res.json({ success: true, attendee });
  } catch (error) {
    logger.error('UPDATE_ATTENDEE_ROLE_ERROR', { error: error.message });

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }

    if (error.message.includes('Invalid role') || error.message.includes('Cannot change')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Error updating attendee' });
  }
};

/**
 * DELETE /api/trips/:tripId/attendees/:attendeeId
 * Remove attendee from trip
 */
exports.removeTripAttendee = async (req, res) => {
  try {
    const { tripId, attendeeId } = req.params;

    // Verify trip exists and user is owner or admin
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (trip.userId !== req.user.id) {
      const access = await attendeeService.validateTripAccess(req.user.id, tripId);
      if (!access || !access.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only trip owner or admin can remove attendees',
        });
      }
    }

    const success = await attendeeService.removeTripAttendee(tripId, attendeeId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Attendee not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('REMOVE_TRIP_ATTENDEE_ERROR', { error: error.message });

    if (error.message.includes('Cannot remove')) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Error removing attendee' });
  }
};
