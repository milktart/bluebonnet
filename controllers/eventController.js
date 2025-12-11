const { Event, Trip } = require('../models');
const logger = require('../utils/logger');
const itemCompanionHelper = require('../utils/itemCompanionHelper');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC,
} = require('./helpers/resourceController');
const { utcToLocal } = require('../utils/timezoneHelper');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { formatDate, formatTime } = require('../utils/dateFormatter');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');

exports.createEvent = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      name,
      location,
      timezone,
      contactPhone,
      contactEmail,
      // Support for separate date/time fields from dashboard form
      startDate,
      startTime,
      endDate,
      endTime,
      description,
      companions,
    } = req.body;
    let { startDateTime, endDateTime } = req.body;

    // Convert separate date/time fields to datetime strings if provided
    if (startDate && !startDateTime) {
      // For all-day events without times, use midnight start
      const time = startTime || '00:00';
      startDateTime = `${startDate}T${time}`;
    }
    if (endDate && !endDateTime) {
      // For all-day events without times, use 23:59 end
      const time = endTime || '23:59';
      endDateTime = `${endDate}T${time}`;
    }

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Trip not found' });
        }
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // Geocode location if provided
    const coords = location ? await geocodeIfChanged(location) : null;

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    if (!finalTimezone && coords?.lat && coords?.lng) {
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(
          coords.lat,
          coords.lng
        );
      } catch (error) {
        logger.error('Error inferring timezone:', error);
        finalTimezone = 'UTC';
      }
    }
    finalTimezone = finalTimezone || 'UTC';

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime
      ? convertToUTC(endDateTime, finalTimezone)
      : convertToUTC(startDateTime, finalTimezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;
    const sanitizedDescription = description && description.trim() !== '' ? description : null;

    const event = await Event.create({
      userId: req.user.id,
      tripId: tripId || null,
      name,
      startDateTime: convertToUTC(startDateTime, finalTimezone),
      endDateTime: finalEndDateTime,
      location,
      timezone: finalTimezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail,
      description: sanitizedDescription,
    });

    // Add companions to this event
    try {
      if (tripId) {
        let companionIds = [];

        // Try to parse companions if provided
        if (companions) {
          try {
            companionIds = typeof companions === 'string' ? JSON.parse(companions) : companions;
            companionIds = Array.isArray(companionIds) ? companionIds : [];
          } catch (e) {
            logger.error('Error parsing companions:', e);
            companionIds = [];
          }
        }

        // If companions were provided and not empty, use them; otherwise use fallback
        if (companionIds.length > 0) {
          await itemCompanionHelper.updateItemCompanions(
            'event',
            event.id,
            companionIds,
            tripId,
            req.user.id
          );
        } else {
          // Fallback: auto-add trip-level companions
          await itemCompanionHelper.autoAddTripCompanions('event', event.id, tripId, req.user.id);
        }
      }
    } catch (e) {
      logger.error('Error managing companions for event:', e);
      // Don't fail the event creation due to companion errors
    }

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event added successfully');
  } catch (error) {
    logger.error('ERROR in createEvent:', error);
    logger.error('Request body:', req.body);
    logger.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error adding event' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding event');
  }
};

exports.updateEvent = async (req, res) => {
  try {
    let {
      name,
      startDateTime,
      endDateTime,
      location,
      timezone,
      contactPhone,
      contactEmail,
      description,
      // Support for separate date/time fields from sidebar form
      startDate,
      startTime,
      endDate,
      endTime,
      tripId: newTripId,
    } = req.body;

    // Convert separate date/time fields to datetime strings if provided
    if (startDate && !startDateTime) {
      // For all-day events without times, use midnight start
      const time = startTime || '00:00';
      startDateTime = `${startDate}T${time}`;
    }
    if (endDate && !endDateTime) {
      // For all-day events without times, use 23:59 end
      const time = endTime || '23:59';
      endDateTime = `${endDate}T${time}`;
    }

    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify event exists
    if (!event) {
      const isAsync =
        req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
      if (isAsync) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync =
        req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Verify trip edit access if changing trip association
    if (newTripId && newTripId !== event.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Cannot attach to this trip' });
        }
        req.flash('error_msg', 'Cannot attach to this trip');
        return res.redirect('back');
      }
    }

    // Geocode location if changed
    const coords = await geocodeIfChanged(
      location,
      event.location,
      location ? { lat: event.lat, lng: event.lng } : null
    );

    // Infer timezone from location if not provided
    let finalTimezone = timezone;
    if (!finalTimezone && coords?.lat && coords?.lng) {
      try {
        finalTimezone = await require('../services/geocodingService').inferTimezone(
          coords.lat,
          coords.lng
        );
      } catch (error) {
        logger.error('Error inferring timezone:', error);
        finalTimezone = event.timezone || 'UTC';
      }
    }
    finalTimezone = finalTimezone || event.timezone || 'UTC';

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime
      ? convertToUTC(endDateTime, finalTimezone)
      : convertToUTC(startDateTime, finalTimezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;
    const sanitizedDescription = description && description.trim() !== '' ? description : null;

    await event.update({
      name,
      startDateTime: convertToUTC(startDateTime, finalTimezone),
      endDateTime: finalEndDateTime,
      location,
      timezone: finalTimezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail,
      description: sanitizedDescription,
      tripId: newTripId || null,
    });

    // Check if this is an async request
    const isAsync =
      req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
    if (isAsync) {
      return res.json({ success: true, message: 'Event updated successfully' });
    }

    redirectAfterSuccess(res, req, event.tripId, 'events', 'Event updated successfully');
  } catch (error) {
    logger.error('ERROR in updateEvent:', error);
    logger.error('Request body:', req.body);
    logger.error('Request params:', req.params);
    const isAsync =
      req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
    if (isAsync) {
      return res
        .status(500)
        .json({ success: false, error: error.message || 'Error updating event' });
    }
    req.flash('error_msg', 'Error updating event');
    res.redirect('back');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    const { tripId } = event;
    const eventData = event.get({ plain: true });

    // Store the deleted event in session for potential restoration
    storeDeletedItem(req.session, 'event', event.id, eventData, event.name);

    await event.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event deleted successfully', itemId: event.id });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event deleted successfully');
  } catch (error) {
    logger.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting event' });
    }
    req.flash('error_msg', 'Error deleting event');
    res.redirect('back');
  }
};

exports.getEventSidebar = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!event || event.userId !== req.user.id) {
      return res.status(404).send('<p class="text-red-600">Event not found</p>');
    }

    // Use the event's timezone for formatting (or UTC if not set)
    const eventTimezone = event.timezone || 'UTC';

    // Format times in the event's timezone to correctly detect all-day events
    const { formatInTimezone } = require('../utils/dateFormatter');
    const startTime = formatInTimezone(event.startDateTime, eventTimezone, 'HH:mm');
    const endTime = formatInTimezone(event.endDateTime, eventTimezone, 'HH:mm');
    const startDate = formatInTimezone(event.startDateTime, eventTimezone, 'DD MMM YYYY');
    const endDate = formatInTimezone(event.endDateTime, eventTimezone, 'DD MMM YYYY');

    // Check if this is an all-day event (times are 00:00 and 23:59)
    const isAllDay = startTime === '00:00' && endTime === '23:59';

    let dateTimeString;
    if (isAllDay) {
      // For all-day events, only show dates
      if (endDate && endDate !== startDate) {
        dateTimeString = `${startDate} - ${endDate}`;
      } else {
        dateTimeString = startDate;
      }
    } else {
      // For regular events, show dates and times
      dateTimeString = `${startDate} ${startTime}`;
      if (endDate && endTime && endDate !== startDate) {
        dateTimeString += ` - ${endDate} ${endTime}`;
      } else if (endDate && endTime && startTime !== endTime) {
        dateTimeString += ` - ${endTime}`;
      }
    }

    res.render('partials/event-sidebar', {
      event,
      dateTime: dateTimeString,
      startDate,
      startTime,
      endDate,
      endTime,
    });
  } catch (error) {
    logger.error('ERROR fetching event sidebar:', error);
    res.status(500).send('<p class="text-red-600">Error loading event details</p>');
  }
};

exports.getEventEditForm = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    if (!event || event.userId !== req.user.id) {
      return res.status(404).send('<p class="text-red-600">Event not found</p>');
    }

    // Format dates for input fields (YYYY-MM-DD format)
    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const startDate = formatDateForInput(event.startDateTime);
    const startTime = formatTimeForInput(event.startDateTime);
    const endDate = formatDateForInput(event.endDateTime);
    const endTime = formatTimeForInput(event.endDateTime);

    res.render('partials/event-edit-form', {
      event,
      startDate,
      startTime,
      endDate,
      endTime,
    });
  } catch (error) {
    logger.error('ERROR fetching event edit form:', error);
    res.status(500).send('<p class="text-red-600">Error loading edit form</p>');
  }
};

exports.getAddForm = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip ownership if tripId provided (for trip-associated items)
    // If no tripId, this is a standalone form (allowed without trip)
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return res.status(403).send('Unauthorized');
      }
    }

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(null, req.user.id);

    res.render('partials/event-form', {
      tripId: tripId || null,
      isEditing: false,
      data: null,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
    res.status(500).send('Error loading form');
  }
};

exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Find event with trip
    const event = await Event.findByPk(id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership
    if (!event || event.userId !== req.user.id) {
      return res.status(403).send('Event not found');
    }

    // Format data for display
    const eventTimezone = event.timezone || 'UTC';

    // Convert UTC times to local timezone for display
    const startDateTimeLocal = utcToLocal(event.startDateTime, eventTimezone);
    const [startDate, startTime] = startDateTimeLocal.split('T');

    const endDateTimeLocal = utcToLocal(event.endDateTime, eventTimezone);
    const [endDate, endTime] = endDateTimeLocal.split('T');

    const formattedData = {
      id: event.id,
      name: event.name,
      location: event.location,
      timezone: eventTimezone,
      startDate,
      startTime,
      endDate,
      endTime,
      contactPhone: event.contactPhone,
      contactEmail: event.contactEmail,
    };

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(event, req.user.id);

    res.render('partials/event-form', {
      tripId: event.tripId,
      isEditing: true,
      data: formattedData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send('Error loading form');
  }
};

exports.getStandaloneForm = async (req, res) => {
  try {
    // Return the standalone event form for dashboard
    res.render('partials/event-form', {
      tripId: null,
      isEditing: false,
      data: null,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send('Error loading form');
  }
};

exports.restoreEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the deleted event from session
    const deletedItem = retrieveDeletedItem(req.session, 'event', id);

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: 'Event not found in undo history' });
    }

    // Verify user owns the event
    if (deletedItem.itemData.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Recreate the event
    await Event.create(deletedItem.itemData);

    res.json({ success: true, message: 'Event restored successfully' });
  } catch (error) {
    logger.error('Error restoring event:', error);
    res.status(500).json({ success: false, error: 'Error restoring event' });
  }
};
