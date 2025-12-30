/**
 * API v1 Events Routes
 * RESTful JSON API for event management
 */

const express = require('express');
const apiResponse = require('../../../utils/apiResponse');
const { ensureAuthenticated } = require('../../../middleware/auth');

const router = express.Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// All event routes require authentication
router.use(ensureAuthenticated);

/**
 * GET /api/v1/events/trips/:tripId
 * Retrieve all events associated with a specific trip
 *
 * Returns events ordered by start date/time (earliest first)
 * Validates that requesting user owns the trip
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 *
 * @returns {Object} 200 OK response with events array
 * @returns {Array} returns - Array of event objects
 * @returns {string} returns[].id - Event ID
 * @returns {string} returns[].tripId - Associated trip ID
 * @returns {string} returns[].name - Event name
 * @returns {string} returns[].location - Event location
 * @returns {string} returns[].startDateTime - Start time in UTC ISO format
 * @returns {string} returns[].endDateTime - End time in UTC ISO format
 * @returns {string} [returns[].description] - Event description
 * @returns {boolean} [returns[].allDay] - All-day event flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Event } = require('../../../models');
    const { Trip } = require('../../../models');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    const events = await Event.findAll({
      where: { tripId },
      order: [['eventDateTime', 'ASC']],
    });

    return apiResponse.success(res, events, `Retrieved ${events.length} events`);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve events', error);
  }
});

/**
 * GET /api/v1/events/:id
 * Retrieve a specific event with its companion assignments
 *
 * Includes all companions assigned to this event (both direct and inherited from trip)
 *
 * @param {string} req.params.id - Event ID (UUID)
 *
 * @returns {Object} 200 OK response with event details
 * @returns {string} returns.id - Event ID
 * @returns {string} returns.name - Event name
 * @returns {string} returns.location - Event location
 * @returns {string} returns.startDateTime - Start time in UTC ISO format
 * @returns {string} returns.endDateTime - End time in UTC ISO format
 * @returns {string} [returns.description] - Event description/notes
 * @returns {boolean} returns.allDay - All-day event flag
 * @returns {string} [returns.category] - Event category (e.g., "conference", "meeting")
 * @returns {string} [returns.url] - Event website or calendar URL
 * @returns {Array} returns.itemCompanions - Assigned companions
 * @returns {string} returns.itemCompanions[].id - Companion ID
 * @returns {string} returns.itemCompanions[].email - Companion email
 * @returns {string} returns.itemCompanions[].firstName - First name
 * @returns {string} returns.itemCompanions[].lastName - Last name
 * @returns {boolean} returns.itemCompanions[].inheritedFromTrip - Trip-level flag
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Event not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.get('/:id', async (req, res) => {
  try {
    const { Event, TravelCompanion, ItemCompanion } = require('../../../models');
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return apiResponse.notFound(res, 'Event not found');
    }

    // Get companions for this event
    const itemCompanions = await ItemCompanion.findAll({
      where: { itemType: 'event', itemId: event.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'firstName', 'lastName', 'name'],
        },
      ],
    });

    // Add companions to response
    const eventData = event.toJSON();
    eventData.itemCompanions = itemCompanions.map((ic) => ({
      id: ic.companion.id,
      email: ic.companion.email,
      firstName: ic.companion.firstName,
      lastName: ic.companion.lastName,
      name: ic.companion.name,
      inheritedFromTrip: ic.inheritedFromTrip,
    }));

    return apiResponse.success(res, eventData, 'Event retrieved successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to retrieve event', error);
  }
});

/**
 * POST /api/v1/events
 * Create a standalone event (not associated with a trip)
 *
 * Supports multiple date/time formats:
 * - startDate + startTime (separate fields)
 * - endDate + endTime (separate fields)
 * - allDay flag for all-day events
 * Combines fields into startDateTime and endDateTime
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Event name
 * @param {string} req.body.location - Event location/venue
 * @param {string} [req.body.description] - Event description
 * @param {string} req.body.startDate - Start date (YYYY-MM-DD)
 * @param {string} [req.body.startTime] - Start time (HH:mm)
 * @param {string} [req.body.endDate] - End date (YYYY-MM-DD)
 * @param {string} [req.body.endTime] - End time (HH:mm)
 * @param {boolean} [req.body.allDay] - All-day event flag (defaults to midnight-23:59)
 * @param {string} [req.body.category] - Event category
 * @param {string} [req.body.url] - Event URL or calendar link
 *
 * @returns {Object} 201 Created response with event object
 * @returns {string} returns.id - Event ID (UUID)
 * @returns {string} returns.name - Event name
 * @returns {string} returns.location - Location
 * @returns {string} returns.startDateTime - Start time (ISO format)
 * @returns {string} returns.endDateTime - End time (ISO format)
 * @returns {boolean} returns.allDay - All-day flag
 *
 * @throws {400} Bad request - Missing required fields
 * @throws {401} Unauthorized - User not authenticated
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/', async (req, res) => {
  try {
    const { Event } = require('../../../models');

    // Transform form data to match model
    const eventData = {
      ...req.body,
      userId: req.user.id,
    };

    // Combine date and time fields into datetime
    // Support both old format (single date field) and new format (startDate/endDate)
    if (req.body.startDate) {
      if (req.body.allDay) {
        // All day event - use midnight
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      } else if (req.body.startTime) {
        eventData.startDateTime = new Date(`${req.body.startDate}T${req.body.startTime}`);
      } else {
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      }
    } else if (req.body.date && req.body.startTime) {
      // Legacy format support
      eventData.startDateTime = new Date(`${req.body.date}T${req.body.startTime}`);
    }

    if (req.body.endDate) {
      if (req.body.allDay) {
        // All day event - use end of day
        eventData.endDateTime = new Date(`${req.body.endDate}T23:59`);
      } else if (req.body.endTime) {
        eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.endTime}`);
      } else if (req.body.startDate === req.body.endDate) {
        // Same day - use same time as start or midnight
        if (req.body.startTime) {
          eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.startTime}`);
        } else {
          eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
        }
      } else {
        eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
      }
    } else if (req.body.date && req.body.endTime) {
      // Legacy format support
      eventData.endDateTime = new Date(`${req.body.date}T${req.body.endTime}`);
    }

    // Create event without tripId (standalone)
    const event = await Event.create(eventData);

    return apiResponse.created(res, event, 'Event created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create event', error);
  }
});

/**
 * POST /api/v1/events/trips/:tripId
 * Create an event for a specific trip
 *
 * Automatically adds all trip-level companions to the new event
 * Supports flexible date/time field combinations (same as POST /api/v1/events)
 *
 * @param {string} req.params.tripId - Trip ID (UUID)
 * @param {Object} req.body - Request body (same as POST /api/v1/events)
 * @param {string} req.body.name - Event name
 * @param {string} req.body.location - Event location
 * @param {string} [req.body.description] - Description
 * @param {string} req.body.startDate - Start date (YYYY-MM-DD)
 * @param {string} [req.body.startTime] - Start time (HH:mm)
 * @param {string} [req.body.endDate] - End date (YYYY-MM-DD)
 * @param {string} [req.body.endTime] - End time (HH:mm)
 * @param {boolean} [req.body.allDay] - All-day event flag
 *
 * @returns {Object} 201 Created response with event object
 * @returns {string} returns.id - Event ID
 * @returns {string} returns.tripId - Associated trip ID
 * @returns {Array} returns.itemCompanions - Auto-added companions from trip level
 *
 * @throws {400} Bad request - Invalid parameters
 * @throws {401} Unauthorized - User not authenticated
 * @throws {403} Forbidden - User does not own the trip
 * @throws {404} Not found - Trip not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.post('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { Trip } = require('../../../models');
    const { Event } = require('../../../models');
    const itemCompanionHelper = require('../../../utils/itemCompanionHelper');

    // Verify trip belongs to user
    const trip = await Trip.findOne({
      where: { id: tripId, userId: req.user.id },
    });

    if (!trip) {
      return apiResponse.forbidden(res, 'Access denied');
    }

    // Transform form data to match model
    const eventData = {
      ...req.body,
      tripId,
    };

    // Combine date and time fields into datetime
    // Support both old format (single date field) and new format (startDate/endDate)
    if (req.body.startDate) {
      if (req.body.allDay) {
        // All day event - use midnight
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      } else if (req.body.startTime) {
        eventData.startDateTime = new Date(`${req.body.startDate}T${req.body.startTime}`);
      } else {
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      }
    } else if (req.body.date && req.body.startTime) {
      // Legacy format support
      eventData.startDateTime = new Date(`${req.body.date}T${req.body.startTime}`);
    }

    if (req.body.endDate) {
      if (req.body.allDay) {
        // All day event - use end of day
        eventData.endDateTime = new Date(`${req.body.endDate}T23:59`);
      } else if (req.body.endTime) {
        eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.endTime}`);
      } else if (req.body.startDate === req.body.endDate) {
        // Same day - use same time as start or midnight
        if (req.body.startTime) {
          eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.startTime}`);
        } else {
          eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
        }
      } else {
        eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
      }
    } else if (req.body.date && req.body.endTime) {
      // Legacy format support
      eventData.endDateTime = new Date(`${req.body.date}T${req.body.endTime}`);
    }

    // Create event
    const event = await Event.create(eventData);

    // Auto-add trip-level companions to the new event
    try {
      await itemCompanionHelper.autoAddTripCompanions('event', event.id, tripId, req.user.id);
    } catch (companionError) {
      // Log error but don't fail the event creation
      console.error('[Event Creation] Error auto-adding companions:', companionError);
    }

    return apiResponse.created(res, event, 'Event created successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to create event', error);
  }
});

/**
 * PUT /api/v1/events/:id
 * Update an existing event
 *
 * Handles flexible date/time field combinations
 * Validates event exists before updating
 *
 * @param {string} req.params.id - Event ID (UUID)
 * @param {Object} req.body - Request body with updatable fields
 * @param {string} [req.body.name] - Updated event name
 * @param {string} [req.body.location] - Updated location
 * @param {string} [req.body.description] - Updated description
 * @param {string} [req.body.startDate] - Updated start date (YYYY-MM-DD)
 * @param {string} [req.body.startTime] - Updated start time (HH:mm)
 * @param {string} [req.body.endDate] - Updated end date (YYYY-MM-DD)
 * @param {string} [req.body.endTime] - Updated end time (HH:mm)
 * @param {boolean} [req.body.allDay] - Updated all-day flag
 * @param {string} [req.body.category] - Updated category
 * @param {string} [req.body.url] - Updated URL
 *
 * @returns {Object} 200 OK response with updated event
 * @returns {string} returns.id - Event ID
 * @returns {string} returns.name - Updated name
 * @returns {string} returns.startDateTime - Updated start time (ISO format)
 * @returns {string} returns.endDateTime - Updated end time (ISO format)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Event not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.put('/:id', async (req, res) => {
  try {
    const { Event } = require('../../../models');
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return apiResponse.notFound(res, 'Event not found');
    }

    // Transform form data to match model
    const eventData = { ...req.body };

    // Combine date and time fields into datetime
    // Support both old format (single date field) and new format (startDate/endDate)
    if (req.body.startDate) {
      if (req.body.allDay) {
        // All day event - use midnight
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      } else if (req.body.startTime) {
        eventData.startDateTime = new Date(`${req.body.startDate}T${req.body.startTime}`);
      } else {
        eventData.startDateTime = new Date(`${req.body.startDate}T00:00`);
      }
    } else if (req.body.date && req.body.startTime) {
      // Legacy format support
      eventData.startDateTime = new Date(`${req.body.date}T${req.body.startTime}`);
    }

    if (req.body.endDate) {
      if (req.body.allDay) {
        // All day event - use end of day
        eventData.endDateTime = new Date(`${req.body.endDate}T23:59`);
      } else if (req.body.endTime) {
        eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.endTime}`);
      } else if (req.body.startDate === req.body.endDate) {
        // Same day - use same time as start or midnight
        if (req.body.startTime) {
          eventData.endDateTime = new Date(`${req.body.endDate}T${req.body.startTime}`);
        } else {
          eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
        }
      } else {
        eventData.endDateTime = new Date(`${req.body.endDate}T00:00`);
      }
    } else if (req.body.date && req.body.endTime) {
      // Legacy format support
      eventData.endDateTime = new Date(`${req.body.date}T${req.body.endTime}`);
    }

    // Update event
    const updated = await event.update(eventData);

    return apiResponse.success(res, updated, 'Event updated successfully');
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to update event', error);
  }
});

/**
 * DELETE /api/v1/events/:id
 * Delete an event
 *
 * Soft delete with cascade cleanup of companion assignments
 * Validates event exists before deletion
 *
 * @param {string} req.params.id - Event ID (UUID)
 *
 * @returns {Object} 204 No Content - successful deletion (no response body)
 *
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not found - Event not found
 * @throws {500} Server error - Database error
 *
 * @requires authentication - User must be logged in
 */
router.delete('/:id', async (req, res) => {
  try {
    const { Event } = require('../../../models');
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return apiResponse.notFound(res, 'Event not found');
    }

    await event.destroy();

    return apiResponse.noContent(res);
  } catch (error) {
    return apiResponse.internalError(res, 'Failed to delete event', error);
  }
});

module.exports = router;
