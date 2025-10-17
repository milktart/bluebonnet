const { localToUTC } = require('../utils/timezoneHelper');
const { Event, Trip } = require('../models');
const geocodingService = require('../services/geocodingService');

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

    // If tripId is provided, verify the trip exists and belongs to user
    if (tripId) {
      const trip = await Trip.findOne({
        where: { id: tripId, userId: req.user.id }
      });

      if (!trip) {
        req.flash('error_msg', 'Trip not found');
        return res.redirect('/trips');
      }
    }

    // Geocode location if provided
    const coords = location ? await geocodingService.geocodeLocation(location) : null;

    // Convert datetime-local inputs to UTC using proper timezone
    const startUTC = localToUTC(startDateTime, timezone);
    const endUTC = localToUTC(endDateTime, timezone);

    await Event.create({
      userId: req.user.id,
      tripId: tripId || null,
      name,
      startDateTime: startUTC,
      endDateTime: endUTC,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone,
      contactEmail
    });

    req.flash('success_msg', 'Event added successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=events`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error adding event');
    if (req.params.tripId) {
      res.redirect(`/trips/${req.params.tripId}`);
    } else {
      res.redirect('/trips');
    }
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

    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!event || event.userId !== req.user.id) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/trips');
    }

    // Geocode location if it changed or was provided
    let coords;
    if (location && location !== event.location) {
      coords = await geocodingService.geocodeLocation(location);
    } else if (!location) {
      coords = null;
    } else {
      coords = { lat: event.lat, lng: event.lng };
    }

    // Convert datetime-local inputs to UTC using proper timezone
    const startUTC = localToUTC(startDateTime, timezone);
    const endUTC = localToUTC(endDateTime, timezone);

    await event.update({
      name,
      startDateTime: startUTC,
      endDateTime: endUTC,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone,
      contactEmail
    });

    req.flash('success_msg', 'Event updated successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (event.tripId) {
      res.redirect(`/trips/${event.tripId}?tab=events`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating event');
    res.redirect('back');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!event || event.userId !== req.user.id) {
      req.flash('error_msg', 'Event not found');
      return res.redirect('/trips');
    }

    const tripId = event.tripId;
    await event.destroy();

    req.flash('success_msg', 'Event deleted successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=events`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting event');
    res.redirect('back');
  }
};