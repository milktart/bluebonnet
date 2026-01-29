const { Event, Trip, ItemTrip } = require('../models');
const logger = require('../utils/logger');
const EventService = require('../services/EventService');
const itemTripService = require('../services/itemTripService');
const { sendAsyncOrRedirect } = require('../utils/asyncResponseHandler');
const {
  verifyTripOwnership,
  verifyResourceOwnership,
  verifyTripItemEditAccess,
} = require('./helpers/resourceController');
const { storeDeletedItem, retrieveDeletedItem } = require('./helpers/deleteManager');
const { getTripSelectorData, verifyTripEditAccess } = require('./helpers/tripSelectorHelper');
const { formatDateForInput, formatTimeForInput } = require('../utils/dateFormatter');
const { ITEM_TYPE_EVENT } = require('../constants/companionConstants');

exports.createEvent = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { companions } = req.body;

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Trip not found',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Use service to prepare event data (handles datetime parsing, geocoding)
    const eventService = new EventService(Event);
    const prepared = await eventService.prepareEventData(req.body);

    // Create event with trip association and companions
    const event = await eventService.createEvent(prepared, req.user.id, {
      tripId,
      companions,
    });

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: event,
      message: 'Event added successfully',
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in createEvent:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error adding event',
      status: 500,
      redirectUrl: req.params.tripId ? `/trips/${req.params.tripId}` : '/dashboard',
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { tripId: newTripId, companions } = req.body;

    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(event, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = event.tripId
      ? await verifyTripItemEditAccess(event.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Event not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    // Verify trip edit access if changing trip association
    if (newTripId && newTripId !== event.tripId) {
      const hasAccess = await verifyTripEditAccess(newTripId, req.user.id);
      if (!hasAccess) {
        return sendAsyncOrRedirect(req, res, {
          error: 'Cannot attach to this trip',
          status: 403,
          redirectUrl: '/',
        });
      }
    }

    // Use service to prepare event data (handles datetime parsing, geocoding)
    const eventService = new EventService(Event);
    const prepared = await eventService.prepareEventData(req.body);

    // Update event via service
    const updated = await eventService.updateEvent(event, prepared, {
      tripId: newTripId,
      companions,
    });

    // Update trip association via ItemTrip if it changed
    try {
      if (newTripId && newTripId !== event.tripId) {
        if (event.tripId) {
          await itemTripService.removeItemFromTrip('event', event.id, event.tripId);
        }
        await itemTripService.addItemToTrip('event', event.id, newTripId, req.user.id);
      } else if (newTripId === null && event.tripId) {
        await itemTripService.removeItemFromTrip('event', event.id, event.tripId);
      }
    } catch (e) {
      logger.error('Error updating event trip association:', e);
    }

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      data: updated,
      message: 'Event updated successfully',
      redirectUrl: newTripId || event.tripId ? `/trips/${newTripId || event.tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in updateEvent:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: error.message || 'Error updating event',
      status: 500,
      redirectUrl: '/dashboard',
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }],
    });

    // Verify ownership - check if user is item creator OR trip owner OR trip admin with canEdit permission
    const isItemOwner = verifyResourceOwnership(event, req.user.id);
    const { TripCompanion } = require('../models');
    const canEditTrip = event.tripId
      ? await verifyTripItemEditAccess(event.tripId, req.user.id, Trip, TripCompanion)
      : false;

    if (!isItemOwner && !canEditTrip) {
      return sendAsyncOrRedirect(req, res, {
        error: 'Event not found',
        status: 403,
        redirectUrl: '/',
      });
    }

    const { tripId } = event;
    const eventData = event.get({ plain: true });

    // Store the deleted event in session for potential restoration
    storeDeletedItem(req.session, 'event', event.id, eventData, event.name);

    // Remove from all trips via ItemTrip
    try {
      await itemTripService.removeItemFromAllTrips('event', event.id);
    } catch (e) {
      logger.error('Error removing event from ItemTrip records:', e);
    }

    await event.destroy();

    // Centralized async/redirect response handling
    return sendAsyncOrRedirect(req, res, {
      success: true,
      message: 'Event deleted successfully',
      data: { itemId: event.id },
      redirectUrl: tripId ? `/trips/${tripId}` : '/dashboard',
    });
  } catch (error) {
    logger.error('ERROR in deleteEvent:', error);
    return sendAsyncOrRedirect(req, res, {
      success: false,
      error: 'Error deleting event',
      status: 500,
      redirectUrl: '/dashboard',
    });
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

    // Format dates/times directly from the stored datetime values (use UTC methods to avoid timezone conversion)
    const formatDateForDisplay = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const day = d.getUTCDate();
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${day} ${month} ${year}`;
    };

    const formatTimeForDisplay = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const startTime = formatTimeForDisplay(event.startDateTime);
    const endTime = formatTimeForDisplay(event.endDateTime);
    const startDate = formatDateForDisplay(event.startDateTime);
    const endDate = formatDateForDisplay(event.endDateTime);

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

    res.json({
      success: true,
      event,
      dateTime: dateTimeString,
      startDate,
      startTime,
      endDate,
      endTime,
    });
  } catch (error) {
    logger.error('ERROR fetching event sidebar:', error);
    res.status(500).json({ success: false, error: 'Error loading event details' });
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

    // Format dates for input fields using shared dateFormatter utility
    const startDate = formatDateForInput(event.startDateTime);
    const startTime = formatTimeForInput(event.startDateTime);
    const endDate = formatDateForInput(event.endDateTime);
    const endTime = formatTimeForInput(event.endDateTime);

    res.json({
      success: true,
      event,
      startDate,
      startTime,
      endDate,
      endTime,
    });
  } catch (error) {
    logger.error('ERROR fetching event edit form:', error);
    res.status(500).json({ success: false, error: 'Error loading edit form' });
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

    res.json({
      success: true,
      tripId: tripId || null,
      isEditing: false,
      data: null,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('Error fetching add form:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
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

    // Format dates for input fields using shared dateFormatter utility
    const startDate = formatDateForInput(event.startDateTime);
    const startTime = formatTimeForInput(event.startDateTime);
    const endDate = formatDateForInput(event.endDateTime);
    const endTime = formatTimeForInput(event.endDateTime);

    const formattedData = {
      id: event.id,
      name: event.name,
      location: event.location,
      startDate,
      startTime,
      endDate,
      endTime,
      contactPhone: event.contactPhone,
      contactEmail: event.contactEmail,
      isConfirmed: event.isConfirmed,
    };

    // Get trip IDs from ItemTrip if available (new system)
    let associatedTripIds = [];
    try {
      const itemTrips = await ItemTrip.findAll({
        where: {
          itemId: event.id,
          itemType: ITEM_TYPE_EVENT,
        },
        attributes: ['tripId'],
      });
      associatedTripIds = itemTrips.map((it) => it.tripId);
    } catch (e) {
      logger.error('Error fetching ItemTrip associations:', e);
    }

    // Use ItemTrip associations if available, otherwise fall back to event.tripId
    const primaryTripId = associatedTripIds.length > 0 ? associatedTripIds[0] : event.tripId;

    // Fetch trip selector data
    const tripSelectorData = await getTripSelectorData(event, req.user.id);

    res.json({
      success: true,
      tripId: primaryTripId,
      isEditing: true,
      data: formattedData,
      currentTripId: tripSelectorData.currentTripId,
      currentTripName: tripSelectorData.currentTripName,
      availableTrips: tripSelectorData.availableTrips,
    });
  } catch (error) {
    logger.error('ERROR in getEditForm:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
  }
};

exports.getStandaloneForm = async (req, res) => {
  try {
    // Return the standalone event form for dashboard
    res.json({
      success: true,
      tripId: null,
      isEditing: false,
      data: null,
    });
  } catch (error) {
    logger.error('ERROR in getStandaloneForm:', error);
    res.status(500).json({ success: false, error: 'Error loading form' });
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
