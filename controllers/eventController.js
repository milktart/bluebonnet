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
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // Geocode location if provided
    const coords = location ? await geocodeIfChanged(location) : null;

    await Event.create({
      userId: req.user.id,
      tripId: tripId || null,
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: convertToUTC(endDateTime, timezone),
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone,
      contactEmail
    });

    redirectAfterSuccess(res, req, tripId, 'events', 'Event added successfully');
  } catch (error) {
    console.error(error);
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
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Geocode location if changed
    const coords = await geocodeIfChanged(
      location,
      event.location,
      location ? { lat: event.lat, lng: event.lng } : null
    );

    await event.update({
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: convertToUTC(endDateTime, timezone),
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone,
      contactEmail
    });

    redirectAfterSuccess(res, req, event.tripId, 'events', 'Event updated successfully');
  } catch (error) {
    console.error(error);
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
      return redirectAfterError(res, req, null, 'Event not found');
    }

    const tripId = event.tripId;
    await event.destroy();

    redirectAfterSuccess(res, req, tripId, 'events', 'Event deleted successfully');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting event');
    res.redirect('back');
  }
};