const { Transportation, Trip } = require('../models');
const {
  verifyTripOwnership,
  geocodeOriginDestination,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC
} = require('./helpers/resourceController');

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

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // Geocode origin and destination
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      destNew: destination
    });

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
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      confirmationNumber,
      seat
    });

    redirectAfterSuccess(res, req, tripId, 'transportation', 'Transportation added successfully');
  } catch (error) {
    console.error(error);
    redirectAfterError(res, req, req.params.tripId, 'Error adding transportation');
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

    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    // Geocode origin and destination if they changed
    const { originCoords, destCoords } = await geocodeOriginDestination({
      originNew: origin,
      originOld: transportation.origin,
      originCoordsOld: { lat: transportation.originLat, lng: transportation.originLng },
      destNew: destination,
      destOld: transportation.destination,
      destCoordsOld: { lat: transportation.destinationLat, lng: transportation.destinationLng }
    });

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
      departureDateTime: convertToUTC(departureDateTime, originTimezone),
      arrivalDateTime: convertToUTC(arrivalDateTime, destinationTimezone),
      confirmationNumber,
      seat
    });

    redirectAfterSuccess(res, req, transportation.tripId, 'transportation', 'Transportation updated successfully');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating transportation');
    res.redirect('back');
  }
};

exports.deleteTransportation = async (req, res) => {
  try {
    // Find transportation with trip
    const transportation = await Transportation.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(transportation, req.user.id)) {
      return redirectAfterError(res, req, null, 'Transportation not found');
    }

    const tripId = transportation.tripId;
    await transportation.destroy();

    redirectAfterSuccess(res, req, tripId, 'transportation', 'Transportation deleted successfully');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error deleting transportation');
    res.redirect('back');
  }
};