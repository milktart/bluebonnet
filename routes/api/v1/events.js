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
 * Get all events for a trip
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
 * Get event details
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
 * Create an event for a trip
 * Auto-adds trip-level companions to the new event
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
 * Update an event
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
