const { Transportation, Trip } = require('../models');
const geocodingService = require('../services/geocodingService');
const { localToUTC } = require('../utils/timezoneHelper');

exports.createTransportation = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      method,
      journeyNumber,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      departureDateTime,
      arrivalDateTime,
      confirmationNumber,
      seat
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

    // Geocode origin and destination
    const originCoords = await geocodingService.geocodeLocation(origin);
    const destCoords = await geocodingService.geocodeLocation(destination);

    // Convert datetime-local inputs to UTC using proper timezone
    const departureUTC = localToUTC(departureDateTime, originTimezone);
    const arrivalUTC = localToUTC(arrivalDateTime, destinationTimezone);

    await Transportation.create({
      userId: req.user.id,
      tripId: tripId || null,
      method,
      journeyNumber,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      departureDateTime: departureUTC,
      arrivalDateTime: arrivalUTC,
      confirmationNumber,
      seat
    });

    req.flash('success_msg', 'Transportation added successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=transportation`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error adding transportation');
    if (req.params.tripId) {
      res.redirect(`/trips/${req.params.tripId}`);
    } else {
      res.redirect('/trips');
    }
  }
};

exports.updateTransportation = async (req, res) => {
  try {
    const {
      method,
      journeyNumber,
      origin,
      originTimezone,
      destination,
      destinationTimezone,
      departureDateTime,
      arrivalDateTime,
      confirmationNumber,
      seat
    } = req.body;

    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!transportation || transportation.userId !== req.user.id) {
      req.flash('error_msg', 'Transportation not found');
      return res.redirect('/trips');
    }

    // Geocode origin and destination if they changed
    const originCoords = origin !== transportation.origin
      ? await geocodingService.geocodeLocation(origin)
      : { lat: transportation.originLat, lng: transportation.originLng };
    const destCoords = destination !== transportation.destination
      ? await geocodingService.geocodeLocation(destination)
      : { lat: transportation.destinationLat, lng: transportation.destinationLng };

    // Convert datetime-local inputs to UTC using proper timezone
    const departureUTC = localToUTC(departureDateTime, originTimezone);
    const arrivalUTC = localToUTC(arrivalDateTime, destinationTimezone);

    await transportation.update({
      method,
      journeyNumber,
      origin,
      originTimezone,
      originLat: originCoords?.lat,
      originLng: originCoords?.lng,
      destination,
      destinationTimezone,
      destinationLat: destCoords?.lat,
      destinationLng: destCoords?.lng,
      departureDateTime: departureUTC,
      arrivalDateTime: arrivalUTC,
      confirmationNumber,
      seat
    });

    req.flash('success_msg', 'Transportation updated successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (transportation.tripId) {
      res.redirect(`/trips/${transportation.tripId}?tab=transportation`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating transportation');
    res.redirect('back');
  }
};

exports.deleteTransportation = async (req, res) => {
  try {
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!transportation || transportation.userId !== req.user.id) {
      req.flash('error_msg', 'Transportation not found');
      return res.redirect('/trips');
    }

    const tripId = transportation.tripId;
    await transportation.destroy();

    req.flash('success_msg', 'Transportation deleted successfully');

    // Redirect to trip if attached, otherwise to trips list
    if (tripId) {
      res.redirect(`/trips/${tripId}?tab=transportation`);
    } else {
      res.redirect('/trips');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting transportation');
    res.redirect('back');
  }
};