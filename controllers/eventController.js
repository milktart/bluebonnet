const { Event, Trip } = require('../models');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC
} = require('./helpers/resourceController');

exports.createEvent = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      name,
      startDateTime,
      endDateTime,
      location,
      timezone,
      contactPhone,
      contactEmail
    } = req.body;

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

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime ? convertToUTC(endDateTime, timezone) : convertToUTC(startDateTime, timezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;

    await Event.create({
      userId: req.user.id,
      tripId: tripId || null,
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: finalEndDateTime,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event added successfully');
  } catch (error) {
    console.error('ERROR in createEvent:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error adding event' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding event');
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const {
      name,
      startDateTime,
      endDateTime,
      location,
      timezone,
      contactPhone,
      contactEmail
    } = req.body;

    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Geocode location if changed
    const coords = await geocodeIfChanged(
      location,
      event.location,
      location ? { lat: event.lat, lng: event.lng } : null
    );

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime ? convertToUTC(endDateTime, timezone) : convertToUTC(startDateTime, timezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;

    await event.update({
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: finalEndDateTime,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event updated successfully' });
    }

    redirectAfterSuccess(res, req, event.tripId, 'events', 'Event updated successfully');
  } catch (error) {
    console.error('ERROR in updateEvent:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error updating event' });
    }
    req.flash('error_msg', 'Error updating event');
    res.redirect('back');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    const tripId = event.tripId;
    await event.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event deleted successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting event' });
    }
    req.flash('error_msg', 'Error deleting event');
    res.redirect('back');
  }
};